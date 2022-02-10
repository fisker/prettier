import path from "node:path";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiJestSnapshot from "chai-jest-snapshot";
import * as td from "testdouble";
import createEsmUtils from "esm-utils";
import installPrettier from "./install-prettier.js";

const { dirname } = createEsmUtils(import.meta);
const isProduction = process.env.NODE_ENV === "production";
const TEST_STANDALONE = Boolean(process.env.TEST_STANDALONE);
const INSTALL_PACKAGE = Boolean(process.env.INSTALL_PACKAGE);

const PROJECT_ROOT = path.join(dirname, "../../");
let PRETTIER_DIR = isProduction
  ? path.join(PROJECT_ROOT, "dist")
  : PROJECT_ROOT;
if (INSTALL_PACKAGE || (isProduction && !TEST_STANDALONE)) {
  PRETTIER_DIR = installPrettier(PRETTIER_DIR);
}
process.env.PRETTIER_DIR = PRETTIER_DIR;

chai.use(chaiAsPromised);
chai.use(chaiJestSnapshot);
global.expect = chai.expect;

global.td = td;

export const mochaHooks = {
  before() {
    chaiJestSnapshot.resetSnapshotRegistry();
  },
  beforeEach() {
    chaiJestSnapshot.configureUsingMochaContext(this);
  },
};
