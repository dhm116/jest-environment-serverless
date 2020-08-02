declare module 'serverless' {
  import { ApiGatewayEvent } from 'serverless/plugins/aws/package/compile/events/apiGateway/lib/validate';
  import AwsProvider from 'serverless/plugins/aws/provider/awsProvider';
  import Config from 'serverless/classes/Config';
  import PluginManager from 'serverless/classes/PluginManager';
  import Service from 'serverless/classes/Service';
  import Utils from 'serverless/classes/Utils';
  import Variables from 'serverless/classes/Variables';
  import YamlParser from 'serverless/classes/YamlParser';

  export interface Options {
    function?: string;
    watch?: boolean;
    extraServicePath?: string;
    stage: string | null;
    region: string | null;
    noDeploy?: boolean;
  }

  export interface FunctionDefinition {
    name: string;
    package: Package;
    runtime?: string;
    handler: string;
    timeout?: number;
    memorySize?: number;
    environment?: { [name: string]: string };
    events: Event[];
    tags?: { [key: string]: string };
  }

  // Other events than ApiGatewayEvent are available
  export type Event = ApiGatewayEvent | object;

  export interface Package {
    include: string[];
    exclude: string[];
    artifact?: string;
    individually?: boolean;
  }

  export default class Serverless {
    cli: {
      log(message: string): null;
    };
    cliInputArgv: Array<string>;

    providers: {};
    utils: Utils;
    variables: Variables;
    yamlParser: YamlParser;
    pluginManager: PluginManager;

    config: Config;
    serverlessDirPath: string;

    service: Service;
    version: string;

    constructor(config?: {});

    init(): Promise<any>;
    run(): Promise<any>;

    setProvider(name: string, provider: AwsProvider): null;
    getProvider(name: string): AwsProvider;

    getVersion(): string;
  }
}

declare module 'serverless/plugins/aws/package/compile/events/apiGateway/lib/validate' {
  export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete' | 'any';

  // Event configuration evolves depending on current lifecycle at getEventInFunction method invokaction
  export interface ApiGatewayEvent {
    http:
      | string
      | {
          path: string;
          mehtod: HttpMethod;
          authorizer?: any;
          cors?: any;
          integration?: string;
        };
  }

  export function getHttp<T extends object>(
    event: { http: T | string },
    functionName: string
  ): { path: string; method: string } | T;

  export function getHttpPath(http: { path: string }, functionName: string): string;

  export function getHttpMethod(http: { method: string }, functionName: string): HttpMethod;
}

declare module 'serverless/classes/Config' {
  import Serverless from 'serverless';

  export default class Config {
    serverless: Serverless;
    serverlessPath: string;
    [key: string]: any;

    constructor(serverless: Serverless, config: {});
    update(config: {}): this;
  }
}

declare module 'serverless/classes/Plugin' {
  import Serverless from 'serverless';
  import { Options } from 'serverless';

  export interface Hooks {
    [event: string]: (...rest: any[]) => any;
  }

  export interface Commands {
    [command: string]: {
      usage?: string;
      lifecycleEvents?: string[];
      commands?: { [command: string]: {} };
      options?: {
        [option: string]: {
          usage?: string;
          required?: boolean;
          shortcut?: string;
        };
      };
    };
  }

  export type VariableResolver = (variableSource: string) => Promise<any>;

  export interface VariableResolvers {
    [variablePrefix: string]:
      | VariableResolver
      | {
          resolver: VariableResolver;
          isDisabledAtPrepopulation?: boolean;
          serviceName?: string;
        };
  }

  export interface PluginStatic {
    new (serverless: Serverless, options: Options): Plugin;
  }

  export default interface Plugin {
    hooks: Hooks;
    commands?: Commands;
    variableResolvers?: VariableResolvers;
  }
}

declare module 'serverless/classes/PluginManager' {
  import Serverless from 'serverless';
  import { Options } from 'serverless';
  import Plugin from 'serverless/classes/Plugin';
  import { PluginStatic } from 'serverless/classes/Plugin';

  export default class PluginManager {
    cliOptions: {};
    cliCommands: {};
    serverless: Serverless;
    plugins: Plugin[];
    commands: {};
    hooks: {};
    deprecatedEvents: {};

    constructor(serverless: Serverless);
    setCliOptions(options: Options): void;
    setCliCommands(commands: {}): void;

    addPlugin(plugin: PluginStatic): void;
    loadAllPlugins(servicePlugins: {}): void;
    loadPlugins(plugins: {}): void;
    loadCorePlugins(): void;
    loadServicePlugins(servicePlugins: {}): void;
    loadCommand(pluginName: string, details: {}, key: string): {};
    loadCommands(pluginInstance: Plugin): void;
    spawn(commandsArray: string | string[], options?: any): Promise<void>;
  }
}

declare module 'serverless/classes/PromiseTracker' {
  export default class PromiseTracker {
    promiseList: Array<PromiseLike<any>>;
    promiseMap: Record<string, PromiseLike<any>>;
    startTime: number;
    reported: boolean;
    interval?: NodeJS.Timeout;

    constructor();

    reset(): void;
    start(): void;
    report(): void;
    stop(): void;
    add(variable: string, prms: PromiseLike<any>, specifier: any): PromiseLike<any>;
    constains(variable: string): boolean;
    get(variable: string, specifier: any): PromiseLike<any>;
    getPending(): PromiseLike<any>[];
    getSettled(): PromiseLike<any>[];
    getResolved(): PromiseLike<any>[];
    getRejected(): PromiseLike<any>[];
    getAll(): PromiseLike<any>[];
  }
}

declare module 'serverless/classes/Service' {
  import Serverless from 'serverless';
  import { FunctionDefinition, Event } from 'serverless';

  export default class Service {
    custom: Record<string, any>;
    functions: Record<string, any>;
    plugins: Array<any>;
    pluginsData: Object;
    provider: Provider;
    resources: Object;
    package: Object;
    service?: string;
    serviceObject?: Object;

    constructor(serverless: Serverless, data: {});

    load(rawOptions: {}): Promise<any>;
    setFunctionNames(rawOptions: {}): void;

    getServiceName(): string;
    getAllFunctions(): string[];
    getAllFunctionsNames(): string[];
    getFunction(functionName: string): FunctionDefinition;
    getEventInFunction(eventName: string, functionName: string): Event;
    getAllEventsInFunction(functionName: string): Event[];

    mergeArrays(): void;
    mergeResourceArrays(): void;
    validate(): Service;

    update(data: {}): {};
  }

  export interface Provider {
    compiledCloudFormationTemplate: {
      Resources: Record<string, any>;
      Outputs?: Record<string, any>;
    };
    name: string;
    stage: string;
    region: string;
    runtime?: string;
    timeout?: number;
    versionFunctions: boolean;

    [key: string]: any;
  }
}

declare module 'serverless/classes/Utils' {
  import Serverless from 'serverless';

  export default class Utils {
    constructor(serverless: Serverless);

    getVersion(): string;
    dirExistsSync(dirPath: string): boolean;
    fileExistsSync(filePath: string): boolean;
    writeFileDir(filePath: string): void;
    writeFileSync(filePath: string, contents: string): void;
    writeFile(filePath: string, contents: string): PromiseLike<{}>;
    appendFileSync(filePath: string, contents: string): PromiseLike<{}>;
    readFileSync(filePath: string): {};
    readFile(filePath: string): PromiseLike<{}>;
    walkDirSync(dirPath: string): string[];
    copyDirContentsSync(srcDir: string, destDir: string): void;
    generateShortId(length: number): string;
    findServicePath(): string;
    logStat(serverless: Serverless, context: string): PromiseLike<{}>;
  }
}

declare module 'serverless/classes/Variables' {
  import Serverless from 'serverless';
  import PromiseTracker from 'serverless/classes/PromiseTracker';
  import Service from 'serverless/classes/Service';

  export interface VariableResolver {
    isDisabledAtPrepoulation?: boolean;
    regex: RegExp;
    resolver: Function;
    serviceName?: string;
  }

  export interface TerminalProperty {
    path: Array<string>;
    value: any;
  }

  export interface MatchResult {
    match: string;
    variable: string;
  }

  export default class Variables {
    serverless: Serverless;
    service: Service;
    tracker: PromiseTracker;

    deep: Array<any>;
    deepRefSyntax: RegExp;
    overwriteSyntax: RegExp;
    fileRefSyntax: RegExp;
    slsRefSyntax: RegExp;
    envRefSyntax: RegExp;
    optRefSyntax: RegExp;
    selfRefSyntax: RegExp;
    stringRefSyntax: RegExp;
    boolRefSyntax: RegExp;
    intRefSyntax: RegExp;
    s3RefSyntax: RegExp;
    cfRefSyntax: RegExp;
    ssmRefSyntax: RegExp;
    strToBoolRefSyntax: RegExp;

    variableResolvers: Array<VariableResolver>;

    variableSyntax?: RegExp;

    constructor(serverless: Serverless);

    loadVariableSyntax(): void;
    initialCall(func: Function): PromiseLike<any>;
    disableDependentServices(func: Function): PromiseLike<any>;
    prepopulateService(): Promise<undefined>;
    populateService(processedOptions: object): PromiseLike<Service>;
    getProperties(root: object, atRoot: boolean, current: any, cntxt?: Array<any>, rslts?: Array<any>): Array<any>;
    populateVariables(properties: object): Array<PromiseLike<Array<TerminalProperty>>>;
    assignProperties(target: object, populations: Array<TerminalProperty>): PromiseLike<number>;
    populateObject(objectToPopulate: object): PromiseLike<object>;
    populateObjectImpl(objectToPopulate: object): PromiseLike<object>;
    cleanVariable(match: string): string;
    getMatches(property: string | object): string | object | Array<MatchResult>;
    populateMatches(matches: Array<MatchResult>, property: string): Array<PromiseLike<any>>;
    renderMatches(value: object, matches: Array<MatchResult>, results: Array<any>): object;
  }
}

declare module 'serverless/classes/YamlParser' {
  import Serverless from 'serverless';

  export default class YamlParser {
    constructor(serverless: Serverless);
    parse(yamlFilePath: string): PromiseLike<any>;
  }
}

declare module 'serverless/plugins/aws/provider/awsProvider' {
  import { Options } from 'serverless';
  /*
        Types based on https://github.com/serverless/serverless/blob/master/docs/providers/aws/guide/serverless.yml.md
    */
  export interface Serverless {
    service: Service | string;
    frameworkVersion: string;
    provider: Provider;
    package?: Package;
    functions?: Functions;
    layers?: Layers;
    resources?: Resources;
    plugins?: string[];
    org?: string;
    app?: string;
    tenant?: string;
    custom?: Custom;
  }

  export interface Service {
    name: string;
    awsKmsKeyArn?: string;
  }

  export interface Provider {
    name: 'aws';
    runtime: string;
    stage?: string;
    region?: string;
    stackName?: string;
    apiName?: string;
    websocketsApiName?: string;
    websocketsApiRouteSelectionExpression?: string;
    profile?: string;
    memorySize?: number | string;
    reservedConcurrency?: number | string;
    timeout?: number | string;
    logRetentionInDays?: number | string;
    deploymentBucket?: DeploymentBucket;
    deploymentPrefix?: string;
    role?: string;
    rolePermissionsBoundary?: string;
    cfnRole?: string;
    versionFunctions?: boolean;
    environment?: Environment;
    endpointType?: 'regional' | 'edge' | 'private';
    apiKeys?: string[];
    apiGateway?: ApiGateway;
    alb?: Alb;
    httpApi?: HttpApi;
    usagePlan?: UsagePlan;
    stackTags?: Tags;
    iamManagedPolicies?: string[];
    iamRoleStatements?: IamRoleStatement[];
    stackPolicy?: ResourcePolicy[];
    vpc?: Vpc;
    notificationArns?: string[];
    stackParameters?: StackParameters[];
    resourcePolicy?: ResourcePolicy[];
    rollbackConfiguration?: RollbackConfiguration;
    tags?: Tags;
    tracing?: Tracing;
    logs?: Logs;
  }

  export interface Tags {
    [key: string]: string;
  }

  export interface DeploymentBucket {
    name?: string;
    maxPreviousDeploymentArtifacts?: number | string;
    blockPublicAccess?: boolean;
    serverSideEncryption?: string;
    sseKMSKeyId?: string;
    sseCustomerAlgorithim?: string;
    sseCustomerKey?: string;
    sseCustomerKeyMD5?: string;
    tags?: Tags;
  }

  export interface Environment {
    [key: string]: any;
  }

  export interface ApiGateway {
    restApiId?: string;
    restApiRootResourceId?: string;
    restApiResources?: {
      [key: string]: string;
    };
    websocketApiId?: any;
    apiKeySourceType?: string;
    minimumCompressionSize?: number | string;
    description?: string;
    binaryMediaTypes?: string[];
  }

  export interface CognitoAuthorizer {
    type: 'cognito';
    userPoolArn: string;
    userPoolClientId: string;
    userPoolDomain: string;
    allowUnauthenticated?: boolean;
    requestExtraParams?: {
      prompt?: string;
      redirect?: boolean;
    };
    scope?: string;
    sessionCookieName?: string;
    sessionTimeout?: number | string;
  }

  export interface OidcAuthorizer {
    type: 'oidc';
    authorizationEndpoint: string;
    clientId: string;
    clientSecret?: string;
    useExistingClientSecret?: boolean;
    issuer: string;
    tokenEndpoint: string;
    userInfoEndpoint: string;
    allowUnauthenticated?: boolean;
    requestExtraParams?: {
      prompt?: string;
      redirect?: boolean;
    };
    scope?: string;
    sessionCookieName?: string;
    sessionTimeout?: number | string;
  }

  export interface JwtAuthorizer {
    identitySource: string;
    issuerUrl: string;
    audience: string[];
  }

  export interface Authorizers {
    [key: string]: CognitoAuthorizer | OidcAuthorizer | JwtAuthorizer;
  }

  export interface Alb {
    targetGroupPrefix?: string;
    authorizers?: Authorizers;
  }

  export interface HttpApi {
    id?: string;
    name?: string;
    payload?: string;
    cors?: boolean;
    authorizers?: Authorizers;
  }

  export interface Quota {
    limit?: number | string;
    offset?: number | string;
    period?: string;
  }

  export interface Throttle {
    burstLimit?: number | string;
    rateLimit?: number | string;
  }

  export interface UsagePlan {
    quota?: Quota;
    throttle?: Throttle;
  }

  export interface IamRoleStatement {
    Effect: 'Allow' | 'Deny';
    Sid?: string;
    Condition?: {
      [key: string]: any;
    };
    Action?: string | string[] | { [key: string]: any };
    NotAction?: string | string[] | { [key: string]: any };
    Resource?: string | string[] | { [key: string]: any };
    NotResource?: string | string[] | { [key: string]: any };
  }

  export interface ResourcePolicy {
    Effect: 'Allow' | 'Deny';
    Principal?: string | string[] | { [key: string]: any };
    Action?: string | string[] | { [key: string]: any };
    Resource?: string | string[] | { [key: string]: any };
    Condition?: {
      [key: string]: any;
    };
  }

  export interface Vpc {
    securityGroupIds: string[];
    subnetIds: string[];
  }

  export interface StackParameters {
    ParameterKey: string;
    ParameterValue: string;
  }

  export interface RollbackTrigger {
    Arn: string;
    Type: string;
  }

  export interface RollbackConfiguration {
    MonitoringTimeInMinutes: number | string;
    RollbackTriggers: RollbackTrigger[];
  }

  export interface Tracing {
    apiGateway: boolean;
    lambda?: boolean;
  }

  export interface RestApiLogs {
    accessLogging?: boolean;
    format?: string;
    executionLogging?: boolean;
    level?: string;
    fullExecutionData?: boolean;
    role?: string;
    roleManagedExternally?: boolean;
  }

  export interface WebsocketLogs {
    level?: string;
  }

  export interface HttpApiLogs {
    format?: string;
  }

  export interface Logs {
    restApi?: RestApiLogs;
    websocket?: WebsocketLogs;
    httpApi?: boolean | HttpApiLogs;
    frameworkLambda?: boolean;
  }

  export interface Package {
    include?: string[];
    exclude?: string[];
    excludeDevDependencies?: boolean;
    artifact?: string;
    individually?: boolean;
  }

  export interface Destinations {
    onSuccess?: string;
    onFailure?: string;
  }

  export interface HttpAuthorizer {
    name?: string;
    arn?: string;
    resultTtlInSeconds?: number | string;
    identitySource?: string;
    identityValidationExpression?: string;
    type?: string;
  }

  export interface HttpCors {
    origins?: string | string[];
    headers?: string | string[];
    allowCredentials?: boolean;
    maxAge?: number;
    cacheControl?: string;
  }

  export interface HttpRequestParametersValidation {
    querystrings?: { [key: string]: boolean };
    headers?: { [key: string]: boolean };
    paths?: { [key: string]: boolean };
  }

  export interface HttpRequestValidation {
    parameters?: HttpRequestParametersValidation;
    schema?: { [key: string]: string };
  }

  export interface Http {
    path: string;
    method: string;
    cors?: boolean | HttpCors;
    private?: boolean;
    async?: boolean;
    authorizer?: HttpAuthorizer;
    request?: HttpRequestValidation;
  }

  export interface NamedHttpApiEventAuthorizer {
    name: string;
    scopes?: string[];
  }

  export interface IdRefHttpApiEventAuthorizer {
    id: string;
    scopes?: string[];
  }

  export interface HttpApiEvent {
    method: string;
    path: string;
    authorizer?: NamedHttpApiEventAuthorizer | IdRefHttpApiEventAuthorizer;
  }

  export interface WebsocketAuthorizer {
    name?: string;
    arn?: string;
    identitySource?: string[];
  }

  export interface Websocket {
    route: string;
    routeResponseSelectionExpression?: string;
    authorizer?: WebsocketAuthorizer;
  }

  export interface S3Rule {
    prefix: string;
    suffix: string;
  }

  export interface S3 {
    bucket: string;
    event: string;
    rules: S3Rule[];
    existing?: boolean;
  }

  export interface Input {
    [key: string]: any;
  }

  export interface InputTransformer {
    inputPathsMap: { [key: string]: string };
    inputTemplate: string;
  }

  export interface Schedule {
    name?: string;
    description?: string;
    rate: string;
    enabled?: boolean;
    input?: Input;
    inputPath?: string;
    inputTransformer?: InputTransformer;
  }

  export interface DeadLetterTargetImport {
    arn: string;
    url: string;
  }

  export interface RedrivePolicy {
    deadLetterTargetArn?: string;
    deadLetterTargetRef?: string;
    deadLetterTargetImport?: DeadLetterTargetImport;
  }

  export interface Sns {
    topicName: string;
    displayName?: string;
    filterPolicy?: string[] | { [key: string]: string };
    redrivePolicy?: RedrivePolicy;
  }

  export interface Sqs {
    arn: string;
    batchSize?: number | string;
    maximumRetryAttempts?: number | string;
    enabled?: boolean;
  }

  export interface Stream {
    arn: string;
    batchSize?: number | string;
    startingPosition?: number | string;
    enabled?: boolean;
  }

  export interface AlexaSkill {
    appId: string;
    enabled?: boolean;
  }

  export interface AlexaSmartHome {
    appId: string;
    enabled?: boolean;
  }

  export interface Iot {
    name: string;
    description?: string;
    enabled?: boolean;
    sql: string;
    sqlVersion: string;
  }

  export interface Detail {
    [key: string]: string[];
  }

  export interface CloudwatchEventType {
    source: string[];
    'detail-type': string[];
    detail: Detail;
  }

  export interface CloudwatchEvent {
    event: string;
    name?: string;
    description?: string;
    enabled?: boolean;
    input?: Input;
    inputPath?: string;
    inputTransformer?: InputTransformer;
  }

  export interface CloudwatchLog {
    logGroup: string;
    filter: string;
  }

  export interface CognitoUserPool {
    pool: string;
    trigger: string;
    existing?: boolean;
  }

  export interface AlbEvent {
    listenerArn: string;
    priority: number | string;
    conditions: {
      host: string;
      path: string;
    };
  }

  export interface PatternExisting {
    source: string[];
  }

  export interface PatternInput {
    source: string[];
    'detail-type': string[];
    detail: Detail;
  }

  export interface EventBridge {
    schedule?: string;
    eventBus?: string;
    pattern?: PatternExisting | PatternInput;
    input?: Input;
    inputPath?: string;
    inputTransformer?: InputTransformer;
  }

  export interface Origin {
    DomainName: string;
    OriginPath: string;
    CustomOriginConfig: {
      OriginProtocolPolicy: string;
    };
  }

  export interface CloudFront {
    eventType: string;
    includeBody: boolean;
    pathPattern: string;
    origin: Origin;
  }

  export interface Event {
    http?: Http;
    httpApi?: HttpApiEvent;
    websocket?: Websocket;
    s3?: S3;
    schedule?: string | Schedule;
    sns?: Sns;
    sqs?: Sqs;
    stream?: Stream;
    alexaSkill?: AlexaSkill;
    alexaSmartHome?: AlexaSmartHome;
    iot?: Iot;
    cloudwatchEvent?: CloudwatchEvent;
    cloudwatchLog?: CloudwatchLog;
    cognitoUserPool?: CognitoUserPool;
    alb?: AlbEvent;
    eventBridge?: EventBridge;
    cloudFront?: CloudFront;
  }

  export interface AwsFunction {
    handler: string;
    name?: string;
    description?: string;
    memorySize?: number | string;
    reservedConcurrency?: number | string;
    provisionedConcurrency?: number | string;
    runtime?: string;
    timeout?: number | string;
    role?: string;
    onError?: string;
    awsKmsKeyArn?: string;
    environment?: Environment;
    tags?: Tags;
    vpc?: Vpc;
    package?: Package;
    layers?: string[];
    tracing?: string;
    condition?: string;
    dependsOn?: string[];
    destinations?: Destinations;
    events?: Event[];
  }

  export interface Functions {
    [key: string]: AwsFunction;
  }

  export interface Layer {
    path: string;
    name?: string;
    description?: string;
    compatibleRuntimes?: string[];
    licenseInfo?: string;
    allowedAccounts?: string[];
    retain?: boolean;
  }

  export interface Layers {
    [key: string]: Layer;
  }

  export interface CloudFormationResource {
    Type: string;
    Properties: { [key: string]: any };
    DependsOn?: string | { [key: string]: any };
    DeletionPolicy?: string;
  }

  export interface CloudFormationResources {
    [key: string]: CloudFormationResource;
  }

  export interface Output {
    Description?: string;
    Value: any;
    Export?: {
      Name: any;
    };
    Condition?: any;
  }

  export interface Outputs {
    [key: string]: Output;
  }

  export interface Resources {
    Resources: CloudFormationResources;
    extensions?: CloudFormationResources;
    Outputs?: Outputs;
  }

  export interface Custom {
    [key: string]: any;
  }

  export default class Aws {
    naming: { [key: string]: () => string };
    constructor(serverless: Serverless, options: Options);
    getProviderName(): string;
    getRegion(): string;
    getServerlessDeploymentBucketName(): string;
    getStage(): string;
    getAccountId(): Promise<string>;
    request(
      service: string,
      method: string,
      params?: {},
      options?: { useCache?: boolean; region?: string }
    ): Promise<any>;
  }
}
