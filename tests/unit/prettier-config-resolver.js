import path from "node:path";
import fs from "node:fs/promises";
import { temporaryDirectory } from "tempy";
import Resolver from "../../src/config/prettier-config-explorer/resolver.js";

const NOOP_LOADER = () => {};

/** A tempory directory empty directory used to search config. */
let stopDirectory;

beforeAll(() => {
  stopDirectory = temporaryDirectory();
});

/** Clear all the mocks between each test. */
beforeEach(() => {
  jest.clearAllMocks();
});

// const statSpy = jest.spyOn(fs, "stat");
// const readFileSpy = jest.spyOn(fs, "readFile");

// function mockFileSystem(files) {
//   statSpy.mockImplementation((filePath) => {
//     if (files[filePath]) {
//       return {
//         isFile: () => true,
//       };
//     }

//     throw new Error("ENOENT");
//   });

//   readFileSpy.mockImplementation((filePath) => {
//     if (files[filePath]) {
//       return files[filePath];
//     }

//     throw new Error("ENOENT");
//   });
// }

describe("Resolver.search", () => {
  it("resolve config from the given directory", async () => {
    const statSpy = jest.spyOn(fs, "stat");

    const searchPlaces = [".prettierrc"];
    const actualConfigFile = path.resolve(stopDirectory, ".prettierrc");

    statSpy.mockImplementation((filePath) => {
      if (filePath === actualConfigFile) {
        return {
          isFile: () => true,
        };
      }

      throw new Error("ENOENT");
    });

    const resolver = new Resolver({
      searchPlaces,
      loader: NOOP_LOADER,
    });

    const expectedConfigFile = await resolver.search(stopDirectory);
    expect(expectedConfigFile).toEqual(actualConfigFile);
  });

  it("resolved config from the given directory and its parents", async () => {
    const statSpy = jest.spyOn(fs, "stat");

    const searchPlaces = [".prettierrc"];

    const startDirectory = path.resolve(stopDirectory, "./foo/bar/baz");
    const actualConfigFile = path.resolve(stopDirectory, ".prettierrc");

    statSpy.mockImplementation((filePath) => {
      if (filePath === actualConfigFile) {
        return {
          isFile: () => true,
        };
      }

      throw new Error("ENOENT");
    });

    const resolver = new Resolver({
      searchPlaces,
      loader: NOOP_LOADER,
    });

    const expectedConfigFile = await resolver.search(startDirectory);
    expect(expectedConfigFile).toEqual(actualConfigFile);
  });

  it("returns null if no config is found", async () => {
    jest.spyOn(fs, "stat");
    const searchPlaces = [".__SOME_RANDOM_FILE__"];

    const resolver = new Resolver({
      searchPlaces,
      loader: NOOP_LOADER,
    });

    const configFile = await resolver.search(stopDirectory);
    expect(configFile).toBeNull();
  });

  describe("config resolution order", () => {
    it("searches for config in the given directory in the right order", async () => {
      const statSpy = jest.spyOn(fs, "stat");
      const searchPlaces = [".prettierrc", "prettierrc.json"];

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(stopDirectory, { stopDirectory });

      expect(statSpy.mock.calls).toEqual(
        searchPlaces.map((file) => [path.resolve(stopDirectory, file)]),
      );
    });

    it("searches for config in the given directory and its parents in the right order", async () => {
      const statSpy = jest.spyOn(fs, "stat");
      const startDirectory = path.resolve(stopDirectory, "./foo");
      const searchPlaces = [".prettierrc", "prettierrc.json"];

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(startDirectory, {
        stopDirectory,
      });

      expect(statSpy.mock.calls).toEqual([
        ...searchPlaces.map((file) => [path.resolve(startDirectory, file)]),
        ...searchPlaces.map((file) => [
          path.resolve(startDirectory, "..", file),
        ]),
      ]);
    });

    it("stops searching when a config is found", async () => {
      const statSpy = jest.spyOn(fs, "stat");
      const searchPlaces = [".prettierrc", "prettierrc.json"];

      statSpy.mockResolvedValueOnce({
        isFile: () => true,
      });

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      const configFile = await resolver.search(stopDirectory, {
        stopDirectory,
      });

      expect(configFile).toEqual(path.resolve(stopDirectory, searchPlaces[0]));

      expect(statSpy).toHaveBeenCalledTimes(1);
      expect(statSpy).toHaveBeenCalledWith(
        path.resolve(stopDirectory, searchPlaces[0]),
      );
    });
  });

  describe("stopDirectory option", () => {
    it("should climb up the directory tree until it reaches the stop directory", async () => {
      jest.spyOn(fs, "stat");

      const searchPlaces = [".prettierrc"];
      const startDirectory = path.resolve(stopDirectory, "./foo/bar/baz");

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(startDirectory, { stopDirectory });

      expect(fs.stat).toHaveBeenCalledTimes(4);
    });

    it("should go all the way to the file system root if no stop directory is given", async () => {
      jest.spyOn(fs, "stat");

      const searchPlaces = [".__SOME_RANDOM_FILE__"];
      const startDirectory = path.resolve(stopDirectory, "./foo/bar/baz");

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(startDirectory);

      const directoryDepth = startDirectory.split(path.sep).length;
      expect(fs.stat).toHaveBeenCalledTimes(directoryDepth);
    });
  });

  describe("cache option", () => {
    it("should cache the resolved config for the same directory when cache is set to true", async () => {
      const searchPlaces = [".prettierrc"];
      const startDirectory = stopDirectory;

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(startDirectory, { cache: true, stopDirectory });
      await resolver.search(startDirectory, { cache: true, stopDirectory });

      expect(fs.stat).toHaveBeenCalledTimes(1);
    });

    it("should not cache the resolved config for the same directory when cache is set to false", async () => {
      const searchPlaces = [".prettierrc"];
      const startDirectory = stopDirectory;

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(startDirectory, { cache: false, stopDirectory });
      await resolver.search(startDirectory, { cache: false, stopDirectory });

      expect(fs.stat).toHaveBeenCalledTimes(2);
    });

    it("should ignore previously cached config when cache is set to false", async () => {
      const searchPlaces = [".prettierrc"];
      const startDirectory = stopDirectory;

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      await resolver.search(startDirectory, { cache: true, stopDirectory });
      await resolver.search(startDirectory, { cache: false, stopDirectory });

      expect(fs.stat).toHaveBeenCalledTimes(2);
    });
  });
});

describe("Resolver.clearCache", () => {
  it("should clear the internal cache and force a new search", async () => {
    const statSpy = jest.spyOn(fs, "stat");

    const searchPlaces = [".prettierrc"];
    const startDirectory = stopDirectory;

    const resolver = new Resolver({
      searchPlaces,
      loader: NOOP_LOADER,
    });

    await resolver.search(startDirectory, { cache: true, stopDirectory });
    expect(statSpy).toHaveBeenCalledTimes(1);

    resolver.clearCache();

    await resolver.search(startDirectory, { cache: true, stopDirectory });
    expect(statSpy).toHaveBeenCalledTimes(2);
  });
});
