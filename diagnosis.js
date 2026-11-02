'use strict';
/**
 * Diagnosis engine: rule-based log analyzer.
 * Each rule has regex patterns, a root-cause explanation, ordered fix suggestions
 * and a sample (stage + log lines) that the simulator reuses to produce realistic failures.
 */

const RULES = [
  {
    id: 'dep_conflict', title: 'Dependency resolution conflict', category: 'Dependencies', severity: 'high', weight: 0.82,
    patterns: [/ERESOLVE/, /unable to resolve dependency tree/i, /Could not resolve dependency/i, /peer dep(endency)? /i, /ResolutionImpossible/, /Conflicting dependencies/i],
    cause: 'Two or more packages require incompatible versions of the same dependency, so the package manager cannot build a valid dependency tree.',
    fixes: [
      'Read the "While resolving / Found / peer" lines to see which two packages disagree.',
      'Upgrade or downgrade the package that declares the incompatible peer dependency.',
      'As a temporary unblock, run the install with --legacy-peer-deps (npm) and open a ticket to fix it properly.',
      'Commit your lockfile and use `npm ci` so CI installs exactly what you tested locally.'
    ],
    sample: { stage: 'Install', lines: [
      'npm ERR! code ERESOLVE', 'npm ERR! ERESOLVE unable to resolve dependency tree', 'npm ERR!',
      'npm ERR! While resolving: {project}@2.4.0', 'npm ERR! Found: react@18.2.0', 'npm ERR! node_modules/react',
      'npm ERR!   react@"^18.2.0" from the root project', 'npm ERR!', 'npm ERR! Could not resolve dependency:',
      'npm ERR! peer react@"^17.0.0" from react-datepicker@4.8.0',
      'npm ERR! Fix the upstream dependency conflict, or retry with --force or --legacy-peer-deps'] }
  },
  {
    id: 'module_missing', title: 'Missing module or import error', category: 'Build', severity: 'high', weight: 0.8,
    patterns: [/Cannot find module/, /Module not found: Error/, /ModuleNotFoundError/, /No module named/, /ImportError: cannot import/, /Can't resolve '/],
    cause: 'The code imports a module that is not installed, is misspelled, or is not exported from the package you expect.',
    fixes: [
      'Check the import path and spelling (including upper/lower case: Linux CI is case-sensitive).',
      'Make sure the package is listed in dependencies (not only devDependencies / requirements-dev).',
      'Delete the cache and reinstall: `npm ci` / `pip install -r requirements.txt`.',
      'If the file exists locally but not in CI, check that it is committed and not in .gitignore.'
    ],
    sample: { stage: 'Build', lines: [
      '> {project}@2.4.0 build', '> webpack --mode production', '',
      "ERROR in ./src/services/paymentClient.js 3:0-42", "Module not found: Error: Can't resolve 'axios-retry' in '/home/runner/work/{project}/src/services'",
      'webpack compiled with 1 error', 'npm ERR! code ELIFECYCLE'] }
  },
  {
    id: 'test_failure', title: 'Unit / integration test failure', category: 'Tests', severity: 'medium', weight: 0.7,
    patterns: [/Tests?:\s+\d+ failed/, /FAIL\s+\S+\.(test|spec)\./, /AssertionError/, /expect\(received\)/, /FAILED .*::/, /\d+ failing/, /Expected: .* Received: /, /✕ /],
    cause: 'One or more automated tests failed. A recent code change probably altered behaviour that the tests assert on, or the test itself is outdated.',
    fixes: [
      'Open the first failing test in the evidence list and compare "Expected" with "Received".',
      'Reproduce locally with the same command CI uses and the same Node/Python version.',
      'Check the commit diff for the code under test: was behaviour intentionally changed? If so update the test.',
      'If the failure is intermittent, quarantine the test and track it as flaky rather than re-running blindly.'
    ],
    sample: { stage: 'Test', lines: [
      ' PASS  src/utils/format.test.js', ' PASS  src/cart/discount.test.js',
      ' FAIL  src/checkout/total.test.js', '  ● Checkout › applies 10% coupon to subtotal', '',
      '    expect(received).toBe(expected) // Object.is equality', '', '    Expected: 90', '    Received: 100', '',
      '      24 |   const total = calculateTotal(cart, "SAVE10");', '    > 25 |   expect(total).toBe(90);', '         |                  ^',
      '', 'Tests:       1 failed, 47 passed, 48 total', 'Test Suites: 1 failed, 6 passed, 7 total'] }
  },
  {
    id: 'snapshot_mismatch', title: 'Snapshot test mismatch', category: 'Tests', severity: 'low', weight: 0.78,
    patterns: [/snapshots? (failed|mismatch|didn't match|do(es)? not match)/i, /toMatchSnapshot/, /Snapshot name:/, /obsolete snapshot/i],
    cause: 'The rendered output no longer matches the stored snapshot. Either the UI/output changed on purpose (snapshot needs updating) or something regressed.',
    fixes: [
      'Review the snapshot diff carefully: is the change intentional?',
      'If intentional, run the tests with `-u` locally and commit the updated snapshot files.',
      'If not intentional, fix the component or function that changed the output.'
    ],
    sample: { stage: 'Test', lines: [
      ' FAIL  src/components/Header.test.jsx', '  ● Header › renders correctly', '',
      '    expect(received).toMatchSnapshot()', '', '    Snapshot name: `Header renders correctly 1`', '',
      '    - Snapshot  - 1', '    + Received  + 1', '', '    - <nav className="header">', '    + <nav className="header header--sticky">', '',
      'Snapshot Summary', ' › 1 snapshot failed from 1 test suite.'] }
  },
  {
    id: 'oom', title: 'Out of memory', category: 'Resources', severity: 'critical', weight: 0.9,
    patterns: [/JavaScript heap out of memory/, /exit code 137/i, /OutOfMemoryError/, /Cannot allocate memory/, /Killed\s*$/m, /FATAL ERROR: .*Allocation failed/],
    cause: 'The build or test process exceeded the memory available on the CI runner and was killed (exit code 137 means SIGKILL from the OOM killer).',
    fixes: [
      'Raise the Node heap limit: `NODE_OPTIONS=--max-old-space-size=4096`.',
      'Run tests with fewer parallel workers (`--maxWorkers=2`) or split the job into smaller jobs.',
      'Use a larger runner / resource class for this job.',
      'Look for a recent change that loads very large files or leaks memory (large fixtures, unbounded caches).'
    ],
    sample: { stage: 'Build', lines: [
      '> {project}@2.4.0 build', '> next build', '',
      '<--- Last few GCs --->', '[1843:0x5c1a3b0]   94213 ms: Mark-sweep 2043.6 (2085.2) -> 2041.9 (2086.2) MB, 1523.4 / 0.0 ms',
      '', '<--- JS stacktrace --->', '',
      'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
      'Aborted (core dumped)', 'Error: Process completed with exit code 137.'] }
  },
  {
    id: 'ts_error', title: 'TypeScript compilation error', category: 'Build', severity: 'high', weight: 0.85,
    patterns: [/error TS\d+:/, /Found \d+ errors?\./, /TS\d{4}/],
    cause: 'The TypeScript compiler found type errors. The build is configured to fail on type errors.',
    fixes: [
      'Fix the first reported error — later errors are often a cascade of it.',
      'Run `npx tsc --noEmit` locally to reproduce.',
      'Check whether a dependency upgrade changed its type definitions (@types/*).'
    ],
    sample: { stage: 'Build', lines: [
      '> {project}@2.4.0 build', '> tsc -p tsconfig.json', '',
      "src/orders/orderService.ts(42,17): error TS2322: Type 'string | undefined' is not assignable to type 'string'.",
      "src/orders/orderService.ts(58,5): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.",
      '', 'Found 2 errors in 1 file.', 'npm ERR! code ELIFECYCLE'] }
  },
  {
    id: 'lint', title: 'Lint check failed', category: 'Code quality', severity: 'low', weight: 0.8,
    patterns: [/✖ \d+ problems?/, /\d+ errors? and \d+ warnings? potentially fixable/, /Parsing error:/, /ESLint found too many warnings/i, /Code style issues found/i, /^\S+\.py:\d+:\d+: [EWFC]\d{3} /],
    cause: 'The linter reported rule violations and the pipeline is set to fail on lint errors.',
    fixes: [
      'Run the linter locally with `--fix` to auto-correct what it can.',
      'Fix remaining errors manually (see evidence lines for file and rule name).',
      'Add a pre-commit hook (husky / pre-commit) so lint runs before code is pushed.'
    ],
    sample: { stage: 'Lint', lines: [
      '> {project}@2.4.0 lint', '> eslint src --max-warnings=0', '',
      '/home/runner/work/{project}/src/api/users.js', "  18:7   error  'tmp' is assigned a value but never used  no-unused-vars",
      '  44:3   error  Unexpected console statement              no-console', '',
      '✖ 2 problems (2 errors, 0 warnings)', '  0 errors and 0 warnings potentially fixable with the `--fix` option.'] }
  },
  {
    id: 'missing_env', title: 'Missing environment variable or secret', category: 'Configuration', severity: 'high', weight: 0.8,
    patterns: [/(environment variable|env var).{0,40}(not set|missing|undefined|required)/i, /Missing required (config|env)/i, /KeyError: '[A-Z_]{3,}'/, /is not defined in the environment/i, /Input required and not supplied/i, /secret.{0,30}(not found|empty)/i],
    cause: 'The application or pipeline expects a configuration value (environment variable / secret) that is not defined in this CI environment.',
    fixes: [
      'Add the variable under repository Settings → Secrets / CI variables for this environment.',
      'Check that the variable name matches exactly (case-sensitive).',
      'Secrets are not exposed to pull requests from forks; use a non-secret test value for PR builds.',
      'Provide a safe default or a clear startup error message in the code.'
    ],
    sample: { stage: 'Test', lines: [
      '> {project}@2.4.0 test:integration', '> jest --config jest.integration.js', '',
      'Error: Missing required environment variable: STRIPE_API_KEY',
      '    at loadConfig (/home/runner/work/{project}/src/config.js:14:11)', '    at Object.<anonymous> (src/server.js:3:1)',
      'npm ERR! Test failed.  See above for more details.'] }
  },
  {
    id: 'db_conn', title: 'Database / service connection refused', category: 'Infrastructure', severity: 'high', weight: 0.84,
    patterns: [/ECONNREFUSED\s+\S*:(5432|3306|27017|6379|9200|5672)/, /could not connect to server/i, /Connection refused/i, /ER_ACCESS_DENIED/, /password authentication failed/i, /SequelizeConnectionRefusedError/],
    cause: 'Tests tried to reach a database or backing service (Postgres, MySQL, Redis, …) that was not running or not ready yet, or credentials were wrong.',
    fixes: [
      'Make sure the service container is declared in the pipeline and uses the same host/port as your config (`localhost` vs service name).',
      'Add a health check / wait-for-it step so tests start only after the service is ready.',
      'Verify DB credentials in CI variables match the service container settings.',
      'Run migrations before the test step.'
    ],
    sample: { stage: 'Test', lines: [
      '> {project}@2.4.0 test:integration', '',
      'SequelizeConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432',
      '    at Client._connectionCallback (node_modules/pg/lib/client.js:132:17)',
      '  ● Orders repository › creates an order', '    Connection terminated unexpectedly', 'Test Suites: 3 failed, 4 passed, 7 total'] }
  },
  {
    id: 'timeout', title: 'Step timed out', category: 'Resources', severity: 'medium', weight: 0.8,
    patterns: [/Error: Timeout of \d+ms exceeded/, /Exceeded timeout of \d+ ?ms/i, /exceeded the (maximum execution time|timeout)/i, /The operation was canceled/, /ETIMEDOUT/, /deadline exceeded/i, /Timeout - Async callback/],
    cause: 'A step or test ran longer than its allowed time. Causes include hanging network calls, deadlocks, a slow runner, or a test waiting for something that never happens.',
    fixes: [
      'Find the last log line before the timeout — that is where the process got stuck.',
      'Add explicit timeouts and mocks for network calls in tests.',
      'Check for un-closed handles (servers, DB connections) keeping the process alive.',
      'If the job is genuinely slow, increase the timeout or split it into parallel jobs.'
    ],
    sample: { stage: 'Test', lines: [
      ' PASS  src/health.test.js', ' FAIL  src/payments/gateway.test.js (61.2 s)', '  ● Gateway › charges a card', '',
      '    thrown: "Exceeded timeout of 5000 ms for a test.', '    Add a timeout value to this test to increase the timeout, if this is a long-running test."', '',
      'Tests:       1 failed, 22 passed, 23 total'] }
  },
  {
    id: 'compile_java', title: 'Compilation error (Java / C / C++)', category: 'Build', severity: 'high', weight: 0.85,
    patterns: [/COMPILATION ERROR/, /cannot find symbol/, /error: incompatible types/, /BUILD FAILURE/, /error: .* undeclared/, /undefined reference to/, /error: package .* does not exist/],
    cause: 'The compiler could not build the source: a symbol, type or package is missing or used incorrectly.',
    fixes: [
      'Go to the first [ERROR] line: it shows the file, line and column of the problem.',
      'Check that the dependency is declared in pom.xml / build.gradle and the version is correct.',
      'Make sure the JDK version used by CI matches the one in your project settings.'
    ],
    sample: { stage: 'Build', lines: [
      '[INFO] Compiling 64 source files to /home/runner/work/{project}/target/classes',
      '[ERROR] COMPILATION ERROR :', '[INFO] -------------------------------------------------------------',
      '[ERROR] /src/main/java/com/acme/billing/InvoiceService.java:[37,22] cannot find symbol',
      '[ERROR]   symbol:   method getTaxRate()', '[ERROR]   location: variable customer of type com.acme.model.Customer',
      '[INFO] BUILD FAILURE', '[ERROR] Failed to execute goal maven-compiler-plugin:3.11.0:compile (default-compile) on project {project}'] }
  },
  {
    id: 'syntax_error', title: 'Syntax error in source file', category: 'Build', severity: 'high', weight: 0.76,
    patterns: [/SyntaxError:/, /Unexpected token/, /IndentationError/, /Parse error/i],
    cause: 'A source file contains invalid syntax (missing bracket, stray character, wrong indentation or unsupported language feature for the runtime version).',
    fixes: [
      'Open the file and line given in the stack trace.',
      'Check for merge-conflict markers (<<<<<<<) accidentally committed.',
      'Verify the runtime version in CI supports the syntax used (e.g. optional chaining needs Node 14+).'
    ],
    sample: { stage: 'Build', lines: [
      '/home/runner/work/{project}/src/utils/date.js:21', '  const d = new Date(value)?.toISOString()', '                                ^',
      'SyntaxError: Unexpected token \'.\'', '    at wrapSafe (internal/modules/cjs/loader.js:979:16)', '    at Module._compile (internal/modules/cjs/loader.js:1027:27)'] }
  },
  {
    id: 'docker_pull', title: 'Docker image pull / registry error', category: 'Infrastructure', severity: 'medium', weight: 0.86,
    patterns: [/toomanyrequests/, /pull rate limit/i, /pull access denied/i, /manifest unknown/i, /repository does not exist/i, /denied: requested access to the resource is denied/i],
    cause: 'The runner could not download a Docker image: usually Docker Hub rate limiting for anonymous pulls, a wrong image tag, or missing registry credentials.',
    fixes: [
      'Log in to the registry in the pipeline (docker login) so pulls are authenticated.',
      'Mirror base images to your own registry or use a pull-through cache.',
      'Check that the image name and tag exist and are spelled correctly.',
      'Retry later if the failure is a rate limit — the limit resets every 6 hours.'
    ],
    sample: { stage: 'Build', lines: [
      'Step 1/9 : FROM node:20-alpine', 'Error response from daemon: toomanyrequests: You have reached your pull rate limit.',
      'You may increase the limit by authenticating and upgrading: https://www.docker.com/increase-rate-limit',
      'ERROR: failed to solve: node:20-alpine: failed to authorize'] }
  },
  {
    id: 'k8s_deploy', title: 'Kubernetes deployment failed', category: 'Deployment', severity: 'critical', weight: 0.88,
    patterns: [/ImagePullBackOff/, /ErrImagePull/, /CrashLoopBackOff/, /progress deadline/i, /Back-off restarting failed container/, /error validating data/i],
    cause: 'The new version was deployed but pods are not becoming healthy: the image cannot be pulled, the container crashes at start-up, or the rollout stalled.',
    fixes: [
      'Run `kubectl describe pod` and `kubectl logs --previous` for the failing pod.',
      'Check the image tag exists in the registry and the cluster has pull secrets.',
      'Verify config/secret references and readiness probes in the manifest.',
      'Roll back with `kubectl rollout undo` if production is impacted.'
    ],
    sample: { stage: 'Deploy', lines: [
      'deployment.apps/{project} configured', 'Waiting for deployment "{project}" rollout to finish: 1 out of 3 new replicas have been updated...',
      'pod/{project}-7d9f8c6b5-x2k4p   0/1   CrashLoopBackOff   4   2m',
      'error: deployment "{project}" exceeded its progress deadline', 'Error: Process completed with exit code 1.'] }
  },
  {
    id: 'git_auth', title: 'Git authentication / repository access error', category: 'Source control', severity: 'high', weight: 0.88,
    patterns: [/Authentication failed/, /Permission denied \(publickey\)/, /could not read Username/, /Repository not found/, /fatal: unable to access/, /Host key verification failed/],
    cause: 'The runner could not authenticate to the Git remote (expired token, missing deploy key, or revoked access).',
    fixes: [
      'Regenerate the access token / deploy key and update it in the CI secrets.',
      'Confirm the CI user still has read access to the repository (and to any submodules).',
      'For private submodules, configure the checkout step to use a token with access.'
    ],
    sample: { stage: 'Checkout', lines: [
      'Cloning into \'/home/runner/work/{project}\'...', 'remote: Invalid username or password.',
      "fatal: Authentication failed for 'https://github.com/acme/{project}.git/'", 'Error: The process \'/usr/bin/git\' failed with exit code 128'] }
  },
  {
    id: 'disk_full', title: 'Runner out of disk space', category: 'Resources', severity: 'high', weight: 0.9,
    patterns: [/ENOSPC/, /No space left on device/i, /disk quota exceeded/i],
    cause: 'The CI runner ran out of disk space, usually from large caches, Docker layers or build artifacts.',
    fixes: [
      'Clean up before building: `docker system prune -af`, remove old artifacts and caches.',
      'Reduce artifact / cache size or set a retention limit.',
      'Use a runner with more disk, or build in a fresh workspace.'
    ],
    sample: { stage: 'Package', lines: [
      'Step 7/9 : RUN npm run build', 'npm ERR! code ENOSPC', 'npm ERR! syscall write', 'npm ERR! errno -28',
      'npm ERR! nospc ENOSPC: no space left on device, write', 'write /var/lib/docker/tmp/GetImageBlob: No space left on device'] }
  },
  {
    id: 'port_in_use', title: 'Port already in use', category: 'Infrastructure', severity: 'low', weight: 0.85,
    patterns: [/EADDRINUSE/, /address already in use/i, /port is already allocated/i],
    cause: 'A server in the test or build step tried to listen on a port that another process is already using.',
    fixes: [
      'Use a random free port in tests (port 0) instead of a hard-coded one.',
      'Make sure previous servers are shut down in `afterAll` / teardown.',
      'Avoid running two jobs that bind the same port on the same runner.'
    ],
    sample: { stage: 'Test', lines: [
      '> {project}@2.4.0 test:e2e', 'Error: listen EADDRINUSE: address already in use :::3000', '    at Server.setupListenHandle [as _listen2] (node:net:1740:16)',
      '    at listenInCluster (node:net:1788:12)', 'Emitted \'error\' event on Server instance at: { code: \'EADDRINUSE\', port: 3000 }'] }
  },
  {
    id: 'coverage', title: 'Code coverage below threshold', category: 'Code quality', severity: 'low', weight: 0.85,
    patterns: [/coverage threshold .* not met/i, /does not meet .*threshold/i, /Required test coverage of \d+%/i, /TOTAL.*\d+%.*FAIL/],
    cause: 'The tests passed but overall code coverage dropped below the minimum configured for the project.',
    fixes: [
      'Add tests for the new or changed code (see the coverage report for uncovered lines).',
      'Do not lower the threshold just to pass — agree on it with the team first.',
      'Exclude generated code or config files from the coverage calculation if appropriate.'
    ],
    sample: { stage: 'Test', lines: [
      'Test Suites: 7 passed, 7 total', 'Tests:       48 passed, 48 total', '----------|---------|----------|---------|---------|',
      'All files |   71.42 |    64.10 |   70.00 |   71.88 |', '----------|---------|----------|---------|---------|',
      'Jest: "global" coverage threshold for statements (80%) not met: 71.42%', 'Jest: "global" coverage threshold for branches (75%) not met: 64.1%'] }
  },
  {
    id: 'ssl_cert', title: 'SSL / TLS certificate problem', category: 'Network', severity: 'medium', weight: 0.86,
    patterns: [/CERT_HAS_EXPIRED/, /unable to verify the first certificate/i, /SSL certificate problem/i, /x509: certificate/i, /self[- ]signed certificate/i, /UNABLE_TO_GET_ISSUER_CERT/],
    cause: 'A TLS connection failed because a certificate is expired, self-signed, or not trusted by the runner.',
    fixes: [
      'Check the expiry date of the certificate on the remote host.',
      'Add your corporate / internal CA certificate to the runner trust store (NODE_EXTRA_CA_CERTS).',
      'Never disable TLS verification in CI; fix the certificate instead.'
    ],
    sample: { stage: 'Install', lines: [
      'npm ERR! code CERT_HAS_EXPIRED', 'npm ERR! errno CERT_HAS_EXPIRED',
      'npm ERR! request to https://registry.internal.acme.io/lodash failed, reason: certificate has expired'] }
  },
  {
    id: 'net_flaky', title: 'Network error (likely transient)', category: 'Network', severity: 'low', weight: 0.74,
    patterns: [/ECONNRESET/, /ENOTFOUND/, /EAI_AGAIN/, /socket hang up/i, /Could not resolve host/i, /Temporary failure in name resolution/i, /503 Service (Temporarily )?Unavailable/i, /502 Bad Gateway/i],
    cause: 'A download or API call failed because of a network hiccup or a temporary outage of an external service. These failures often pass on a retry.',
    fixes: [
      'Re-run the job. If it passes, it was a transient failure.',
      'Add automatic retries with backoff for downloads (`npm config set fetch-retries 5`).',
      'Cache dependencies so the pipeline depends less on external services.',
      'Check the status page of the service that failed.'
    ],
    sample: { stage: 'Install', lines: [
      'npm WARN registry Unexpected warning for https://registry.npmjs.org/: Miscellaneous Warning ECONNRESET - request to https://registry.npmjs.org/webpack failed, reason: socket hang up',
      'npm ERR! code ECONNRESET', 'npm ERR! network aborted', 'npm ERR! network This is a problem related to network connectivity.'] }
  },
  {
    id: 'aws_creds', title: 'Cloud credentials / permission error', category: 'Deployment', severity: 'high', weight: 0.86,
    patterns: [/Unable to locate credentials/i, /ExpiredToken/, /AccessDenied/, /not authorized to perform/i, /InvalidClientTokenId/, /403 Forbidden/],
    cause: 'The deployment step could not authenticate to the cloud provider, or the role it uses lacks permission for the action.',
    fixes: [
      'Check that the cloud credentials / OIDC role are configured for this branch or environment.',
      'If the token expired, shorten the job or refresh credentials before the deploy step.',
      'Add the missing permission shown in the error to the IAM role (least privilege).'
    ],
    sample: { stage: 'Deploy', lines: [
      'Uploading build artifacts to s3://acme-{project}-prod ...',
      'An error occurred (AccessDenied) when calling the PutObject operation: User: arn:aws:sts::123456789012:assumed-role/ci-deployer/session is not authorized to perform: s3:PutObject',
      'Error: Process completed with exit code 1.'] }
  },
  {
    id: 'permission', title: 'File permission error', category: 'Infrastructure', severity: 'medium', weight: 0.74,
    patterns: [/EACCES: permission denied/, /Permission denied(?! \(publickey)/, /Operation not permitted/],
    cause: 'A command tried to read, write or execute a file it does not have permission for (commonly a script that is not executable).',
    fixes: [
      'Make scripts executable and commit the mode: `git update-index --chmod=+x script.sh`.',
      'Avoid running package managers with sudo; fix directory ownership instead.',
      'Check that the working directory is writable by the CI user.'
    ],
    sample: { stage: 'Package', lines: [
      './scripts/package.sh', '/bin/bash: ./scripts/package.sh: Permission denied', 'Error: Process completed with exit code 126.'] }
  }
];

const STAGE_MARKERS = [
  /Stage:\s*(.+?)\s*$/i,
  /##\[group\](.+)$/,
  /^Step\s+\d+\/\d+\s*:\s*(.+)$/,
  /\[Pipeline\]\s*\{\s*\((.+)\)/,
  /^> Task\s+(\S+)/,
  /^=+>\s*(.+)$/
];

function findFailedStep(lines, firstErrorIdx) {
  const limit = firstErrorIdx >= 0 ? firstErrorIdx : lines.length - 1;
  for (let i = limit; i >= 0; i--) {
    for (const re of STAGE_MARKERS) {
      const m = lines[i].match(re);
      if (m) return m[1].trim();
    }
  }
  return null;
}

const GENERIC_ERR = /\b(error|failed|failure|fatal|exception|traceback|panic|segmentation fault)\b/i;

function diagnose(log) {
  const text = String(log || '');
  if (!text.trim()) {
    return {
      ruleId: 'no_log', title: 'No log available', category: 'Unknown', severity: 'low', confidence: 0,
      cause: 'This build failed but no log output was provided, so no analysis could be made.',
      fixes: ['Send the build log with the webhook payload (field "log") to enable automatic diagnosis.'],
      evidence: [], evidenceLines: [], failedStep: null, otherMatches: [],
      summary: 'No log available for analysis.'
    };
  }
  const lines = text.split(/\r?\n/);
  const scored = [];
  for (const rule of RULES) {
    const hits = new Set();
    let matchedPatterns = 0;
    for (const re of rule.patterns) {
      let any = false;
      lines.forEach((ln, i) => { if (re.test(ln)) { hits.add(i); any = true; } });
      if (any) matchedPatterns++;
    }
    if (matchedPatterns > 0) {
      const confidence = Math.min(0.97, rule.weight + 0.04 * (matchedPatterns - 1));
      scored.push({ rule, hits: [...hits].sort((a, b) => a - b), confidence });
    }
  }
  scored.sort((a, b) => b.confidence - a.confidence);
  const firstErr = lines.findIndex(l => GENERIC_ERR.test(l));

  if (!scored.length) {
    const errLines = [];
    lines.forEach((l, i) => { if (GENERIC_ERR.test(l) && errLines.length < 6) errLines.push(i); });
    if (!errLines.length) {
      return {
        ruleId: 'no_failure', title: 'No failure detected', category: 'None', severity: 'low', confidence: 0.6,
        cause: 'The log contains no error, failure or exception keywords and matches none of the known failure patterns.',
        fixes: ['If you expected a failure, make sure you pasted the complete log (including the last lines of the failed step).'],
        evidence: [], evidenceLines: [], failedStep: null, otherMatches: [], summary: 'No failure detected'
      };
    }
    return {
      ruleId: 'unknown', title: 'Unrecognised failure', category: 'Unknown', severity: 'medium', confidence: 0.2,
      cause: 'The log does not match any known failure pattern. The lines below are the first places where an error was reported.',
      fixes: [
        'Start from the first error line and read upwards for context.',
        'Re-run the job once to check whether the failure is reproducible.',
        'Reproduce locally with the same command and tool versions as CI.',
        'Add this pattern to the diagnosis rules (lib/diagnosis.js) once you find the cause.'
      ],
      evidence: errLines.map(i => ({ line: i + 1, text: lines[i].slice(0, 300) })),
      evidenceLines: errLines.map(i => i + 1),
      failedStep: findFailedStep(lines, firstErr), otherMatches: [],
      summary: 'Unrecognised failure'
    };
  }
  const best = scored[0];
  const evidence = best.hits.slice(0, 8).map(i => ({ line: i + 1, text: lines[i].slice(0, 300) }));
  return {
    ruleId: best.rule.id, title: best.rule.title, category: best.rule.category, severity: best.rule.severity,
    confidence: Number(best.confidence.toFixed(2)), cause: best.rule.cause, fixes: best.rule.fixes,
    evidence, evidenceLines: best.hits.map(i => i + 1),
    failedStep: findFailedStep(lines, best.hits[0]),
    otherMatches: scored.slice(1, 4).map(s => ({ ruleId: s.rule.id, title: s.rule.title, category: s.rule.category, confidence: Number(s.confidence.toFixed(2)) })),
    summary: best.rule.title
  };
}

module.exports = { RULES, diagnose };
