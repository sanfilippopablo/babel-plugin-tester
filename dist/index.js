'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _babelCore = require('babel-core');

var babelCore = _interopRequireWildcard(_babelCore);

var _stripIndent = require('strip-indent');

var _stripIndent2 = _interopRequireDefault(_stripIndent);

var _commonTags = require('common-tags');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var noop = function noop() {};

module.exports = pluginTester;

var fullDefaultConfig = {
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false
  }
};

function pluginTester() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$babel = _ref.babel,
      babel = _ref$babel === undefined ? babelCore : _ref$babel,
      _ref$plugin = _ref.plugin,
      plugin = _ref$plugin === undefined ? requiredParam('plugin') : _ref$plugin,
      _ref$pluginName = _ref.pluginName,
      pluginName = _ref$pluginName === undefined ? getPluginName(plugin, babel) : _ref$pluginName,
      _ref$title = _ref.title,
      describeBlockTitle = _ref$title === undefined ? pluginName : _ref$title,
      pluginOptions = _ref.pluginOptions,
      tests = _ref.tests,
      fixtures = _ref.fixtures,
      _ref$fixtureOutputNam = _ref.fixtureOutputName,
      fixtureOutputName = _ref$fixtureOutputNam === undefined ? 'output' : _ref$fixtureOutputNam,
      filename = _ref.filename,
      rest = _objectWithoutProperties(_ref, ['babel', 'plugin', 'pluginName', 'title', 'pluginOptions', 'tests', 'fixtures', 'fixtureOutputName', 'filename']);

  var testNumber = 1;
  if (fixtures) {
    testFixtures(_extends({
      plugin,
      pluginName,
      pluginOptions,
      title: describeBlockTitle,
      fixtures,
      fixtureOutputName,
      filename,
      babel
    }, rest));
  }
  var testAsArray = toTestArray(tests);
  if (!testAsArray.length) {
    return Promise.resolve();
  }
  var testerConfig = (0, _lodash2.default)({}, fullDefaultConfig, rest);

  return describe(describeBlockTitle, function () {
    var promises = testAsArray.map(function (testConfig) {
      var testerWrapper = function () {
        var _ref2 = _asyncToGenerator(function* () {
          var teardowns = teardown ? [teardown] : [];
          var returnedTeardown = void 0;
          try {
            returnedTeardown = yield setup();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('There was a problem during setup');
            throw e;
          }
          if (typeof returnedTeardown === 'function') {
            teardowns.push(returnedTeardown);
          }
          try {
            tester();
          } finally {
            try {
              yield Promise.all(teardowns.map(function (t) {
                return t();
              }));
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('There was a problem during teardown');
              // eslint-disable-next-line no-unsafe-finally
              throw e;
            }
          }
        });

        return function testerWrapper() {
          return _ref2.apply(this, arguments);
        };
      }();

      // eslint-disable-next-line complexity


      if (!testConfig) {
        return Promise.resolve();
      }

      var _merge = (0, _lodash2.default)({}, testerConfig, toTestConfig(testConfig)),
          skip = _merge.skip,
          only = _merge.only,
          title = _merge.title,
          code = _merge.code,
          babelOptions = _merge.babelOptions,
          output = _merge.output,
          snapshot = _merge.snapshot,
          error = _merge.error,
          _merge$setup = _merge.setup,
          setup = _merge$setup === undefined ? noop : _merge$setup,
          teardown = _merge.teardown,
          _merge$formatResult = _merge.formatResult,
          formatResult = _merge$formatResult === undefined ? function (r) {
        return r;
      } : _merge$formatResult;

      (0, _assert2.default)(!skip && !only || skip !== only, 'Cannot enable both skip and only on a test');

      if (skip) {
        // eslint-disable-next-line jest/no-disabled-tests
        return it.skip(title, testerWrapper);
      } else if (only) {
        // eslint-disable-next-line jest/no-focused-tests
        return it.only(title, testerWrapper);
      } else {
        return it(title, testerWrapper);
      }

      function tester() {
        (0, _invariant2.default)(code, _commonTags.oneLine`
            A string or object with a \`code\` or
            \`fixture\` property must be provided
          `);
        (0, _invariant2.default)(!babelOptions.babelrc || babelOptions.filename, 'babelrc set to true, but no filename specified in babelOptions');
        (0, _invariant2.default)(!snapshot || !output, '`output` cannot be provided with `snapshot: true`');

        var result = void 0;
        var errored = false;

        try {
          result = formatResult(babel.transform(code, babelOptions).code.trim());
        } catch (err) {
          if (error) {
            errored = true;
            result = err;
          } else {
            throw err;
          }
        }

        var expectedToThrowButDidNot = error && !errored;
        (0, _assert2.default)(!expectedToThrowButDidNot, 'Expected to throw error, but it did not.');

        if (snapshot) {
          (0, _invariant2.default)(result !== code, _commonTags.oneLine`
              Code was unmodified but attempted to take a snapshot.
              If the code should not be modified, set \`snapshot: false\`
            `);
          var separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n';
          var formattedOutput = [code, separator, result].join('');
          expect(`\n${formattedOutput}\n`).toMatchSnapshot(title);
        } else if (error) {
          assertError(result, error);
        } else if (output) {
          expect(result).toEqual(output);
        } else {
          _assert2.default.equal(result, code, 'Expected output to not change, but it did');
        }
      }
    });

    return Promise.all(promises);
  });

  function toTestConfig(testConfig) {
    if (typeof testConfig === 'string') {
      testConfig = { code: testConfig };
    }
    var _testConfig = testConfig,
        title = _testConfig.title,
        fixture = _testConfig.fixture,
        _testConfig$code = _testConfig.code,
        code = _testConfig$code === undefined ? getCode(filename, fixture) : _testConfig$code,
        _testConfig$fullTitle = _testConfig.fullTitle,
        fullTitle = _testConfig$fullTitle === undefined ? title || `${testNumber++}. ${pluginName}` : _testConfig$fullTitle,
        _testConfig$output = _testConfig.output,
        output = _testConfig$output === undefined ? getCode(filename, testConfig.outputFixture) : _testConfig$output,
        _testConfig$pluginOpt = _testConfig.pluginOptions,
        testOptions = _testConfig$pluginOpt === undefined ? pluginOptions : _testConfig$pluginOpt;

    return (0, _lodash2.default)({
      babelOptions: { filename: getPath(filename, fixture) }
    }, testConfig, {
      babelOptions: { plugins: [[plugin, testOptions]] },
      title: fullTitle,
      code: (0, _stripIndent2.default)(code).trim(),
      output: (0, _stripIndent2.default)(output).trim()
    });
  }
}

var createFixtureTests = function createFixtureTests(fixturesDir, options) {
  _fs2.default.readdirSync(fixturesDir).forEach(function (caseName) {
    var fixtureDir = _path2.default.join(fixturesDir, caseName);
    var codePath = _path2.default.join(fixtureDir, 'code.js');
    var blockTitle = caseName.split('-').join(' ');

    if (!_pathExists2.default.sync(codePath)) {
      describe(blockTitle, function () {
        createFixtureTests(fixtureDir, options);
      });
      return;
    }

    it(blockTitle, function () {
      var plugin = options.plugin,
          pluginOptions = options.pluginOptions,
          fixtureOutputName = options.fixtureOutputName,
          babel = options.babel,
          rest = _objectWithoutProperties(options, ['plugin', 'pluginOptions', 'fixtureOutputName', 'babel']);

      var babelRcPath = _path2.default.join(fixtureDir, '.babelrc');

      var _merge2 = (0, _lodash2.default)({}, fullDefaultConfig, {
        babelOptions: {
          plugins: [[plugin, pluginOptions]],
          // if they have a babelrc, then we'll let them use that
          // otherwise, we'll just use our simple config
          babelrc: _pathExists2.default.sync(babelRcPath)
        }
      }, rest),
          babelOptions = _merge2.babelOptions;

      var actual = babel.transformFileSync(codePath, babelOptions).code.trim();

      var outputPath = _path2.default.join(fixtureDir, `${fixtureOutputName}.js`);

      if (!_fs2.default.existsSync(outputPath)) {
        _fs2.default.writeFileSync(outputPath, actual);
        return;
      }

      var output = _fs2.default.readFileSync(outputPath, 'utf8').trim();

      _assert2.default.equal(actual, output, `actual output does not match ${fixtureOutputName}.js`);
    });
  });
};

function testFixtures(_ref3) {
  var describeBlockTitle = _ref3.title,
      fixtures = _ref3.fixtures,
      filename = _ref3.filename,
      rest = _objectWithoutProperties(_ref3, ['title', 'fixtures', 'filename']);

  describe(`${describeBlockTitle} fixtures`, function () {
    var fixturesDir = getPath(filename, fixtures);
    createFixtureTests(fixturesDir, rest);
  });
}

function toTestArray(tests) {
  tests = tests || []; // null/0/false are ok, so no default param
  if (Array.isArray(tests)) {
    return tests;
  }
  return Object.keys(tests).reduce(function (testsArray, key) {
    var value = tests[key];
    if (typeof value === 'string') {
      value = { code: value };
    }
    testsArray.push(_extends({
      title: key
    }, value));
    return testsArray;
  }, []);
}

function getCode(filename, fixture) {
  if (!fixture) {
    return '';
  }
  return _fs2.default.readFileSync(getPath(filename, fixture), 'utf8');
}

function getPath(filename, basename) {
  if (!basename) {
    return undefined;
  }
  if (_path2.default.isAbsolute(basename)) {
    return basename;
  }
  return _path2.default.join(_path2.default.dirname(filename), basename);
}

// eslint-disable-next-line complexity
function assertError(result, error) {
  if (typeof error === 'function') {
    if (!(result instanceof error || error(result) === true)) {
      throw result;
    }
  } else if (typeof error === 'string') {
    _assert2.default.equal(result.message, error, 'Error message is incorrect');
  } else if (error instanceof RegExp) {
    (0, _assert2.default)(error.test(result.message), `Expected ${result.message} to match ${error}`);
  } else {
    (0, _invariant2.default)(typeof error === 'boolean', 'The given `error` must be a function, string, boolean, or RegExp');
  }
}

function requiredParam(name) {
  throw new Error(`${name} is a required parameter.`);
}

function getPluginName(plugin, babel) {
  var name = void 0;
  try {
    name = plugin(babel).name;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(_commonTags.oneLine`
        Attempting to infer the name of your plugin failed.
        Tried to invoke the plugin which threw the error.
      `);
    throw error;
  }
  (0, _invariant2.default)(name, 'The `pluginName` must be inferable or provided.');
  return name;
}

/*
eslint
  complexity: "off"
*/