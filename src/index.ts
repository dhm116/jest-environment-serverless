import {runInContext} from 'vm';
import * as path from 'path';

module.paths.unshift(path.join(process.cwd(), 'node_modules'));

import NodeEnvironment from 'jest-environment-node';

import Serverless from 'serverless';

import type {Config, Global} from '@jest/types';

interface ServerlessWrapper {
  getEnv(funcName: string): Record<string, any>;
  setEnv(funcName: string): Record<string, any>;
  rootDir: string;
  Serverless: typeof Serverless;
  serverless: Serverless;
}

interface ServerlessGlobal extends Global.Global {
  ServerlessWrapper: ServerlessWrapper;
}

export default class ServerlessEnvironment extends NodeEnvironment {
  global: ServerlessGlobal;
  serverless: Serverless;

  constructor(config: Config.ProjectConfig) {
    super(config);

    const global = (this.global = runInContext(
      'this',
      Object.assign(this.context, config.testEnvironmentOptions),
    ));
    global.global = global;

    const wrapperPath = path.join(__dirname, 'lambda_wrapper.js');
    const ignoreCoveragePaths = ['\\.serverless', '\\.serverless_plugins'];

    /* Add the LambdaWrapper to the front of the `setupFiles` list */
    if (!(config.setupFiles ??= []).includes(wrapperPath)) {
      config.setupFiles.unshift(wrapperPath);
    }

    /* Make sure `node_modules` is not included in code coverage report */
    if (!(config.coveragePathIgnorePatterns ??= []).includes('node_modules')) {
      config.coveragePathIgnorePatterns.push('node_modules');
    }

    /* Add Serverless directories to ignored code coverage paths */
    ignoreCoveragePaths
      .forEach(ignoredPath => !config.coveragePathIgnorePatterns.includes(ignoredPath)
        ? config.coveragePathIgnorePatterns.push(ignoredPath)
        : null
      );

      /* Create and assign Serverless instance */
      this.global.process.env.SERVERLESS_TEST_ROOT = 'true';

      this.serverless = new Serverless({
        interactive: false,
        servicePath: config.cwd,
      });

      /* Prevent Serverless from capturing Jest CLI arguments */
      this.serverless.cliInputArgv = [];

      this.global.ServerlessWrapper = {
        getEnv: this.getEnv.bind(this),
        setEnv: this.setEnv.bind(this),
        rootDir: config.cwd,
        Serverless,
        serverless: this.serverless,
      };
    }

  getEnv(funcName: string): Record<string, any> {
    const instance = this.global?.ServerlessWrapper?.serverless ?? this.serverless;
    return instance.service?.functions[funcName]?.environment ?? {};
  }

  setEnv(funcName: string): Record<string, any> {
    let target: NodeJS.ProcessEnv;

    if (this.global?.ServerlessWrapper) {
      target = process.env;
    } else {
      target = this.global?.process.env ?? process.env;
    }

    const vars: Record<string, any> = this.getEnv(funcName);

    return Object.assign(target, vars);
  }

  async setup(): Promise<void> {
    await super.setup();

    let instance: Serverless;

    if (this.global?.ServerlessWrapper) {
      instance = this.global.ServerlessWrapper.serverless;
    } else {
      instance = this.serverless;
    }

    await instance.init();
    await instance.variables.populateService({});

    instance.service.mergeArrays();
    instance.service.setFunctionNames({});
    instance.service.validate();

    /* Populate all ENV vars */
    const serviceVars: NodeJS.ProcessEnv = instance.service.provider.environment ?? {};
    const functionVars: Array<NodeJS.ProcessEnv> = instance.service.getAllFunctions().map(this.getEnv.bind(this));
    const vars: NodeJS.ProcessEnv = Object.assign({}, serviceVars, ...functionVars);
    Object.assign(this.global.process.env, vars);
  }
}
