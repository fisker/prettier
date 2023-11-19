import fs from "node:fs/promises";
import Resolver from "../../src/config/prettier-config-explorer/resolver.js";

const NOOP_LOADER = () => {};

let statSpy = jest.spyOn(fs, "stat");
let readFileSpy = jest.spyOn(fs, "readFile");

beforeEach(() => {
  statSpy = jest.spyOn(fs, "stat");
  readFileSpy = jest.spyOn(fs, "readFile");
});

// Restore the original implementation.
afterEach(() => {
  statSpy.mockRestore();
  readFileSpy.mockRestore();
});

/**
 * Naive file system mock for testing purposes.
 * @param {Object} files - An object representing the files in the file system.
 */
function mockFileSystem(files) {
  const fileMap = new Map(Object.entries(files));

  statSpy.mockImplementation((filename) => {
    if (fileMap.has(filename)) {
      return Promise.resolve({
        isFile: () => true,
      });
    }

    return Promise.reject(new Error("ENOENT"));
  });

  readFileSpy.mockImplementation((filename) => {
    if (fileMap.has(filename)) {
      return fileMap.get(filename);
    }

    return Promise.reject(new Error("ENOENT"));
  });
}

describe("Resolver.search", () => {
  describe("config file resolution", () => {
    it("returns null if no config is found", async () => {
      mockFileSystem({});

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      const configFile = await resolver.search("/");
      expect(configFile).toBeNull();
    });

    it("resolve config from the given directory", async () => {
      const configFile = "/.prettierrc";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      const result = await resolver.search("/");
      expect(result).toEqual(configFile);
    });

    it("resolved config from the given directory and its parents", async () => {
      const configFile = "/.prettierrc";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      const result = await resolver.search("/nested");
      expect(result).toEqual(configFile);
    });

    it("searches for config in the given directory in order", async () => {
      const searchPlaces = [".prettierrc", "prettierrc.json"];
      const configFile = "/prettierrc.json";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc", "prettierrc.json"],
        loader: NOOP_LOADER,
      });

      const result = await resolver.search("/");

      expect(result).toEqual(configFile);
      expect(statSpy.mock.calls).toEqual(
        searchPlaces.map((filename) => [`/${filename}`]),
      );
    });

    it("searches for config in the given directory and its parents in order", async () => {
      const searchPlaces = [".prettierrc", "prettierrc.json"];
      const configFile = "/prettierrc.json";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      const result = await resolver.search("/nested");

      expect(result).toEqual(configFile);
      expect(statSpy.mock.calls).toEqual([
        ...searchPlaces.map((filename) => [`/nested/${filename}`]),
        ...searchPlaces.map((filename) => [`/${filename}`]),
      ]);
    });

    it("stops searching when a config is found", async () => {
      const searchPlaces = [".prettierrc", "prettierrc.json"];
      const configFile = "/nested/prettierrc.json";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces,
        loader: NOOP_LOADER,
      });

      const result = await resolver.search("/nested");

      expect(result).toEqual(configFile);
      expect(statSpy.mock.calls).toEqual(
        searchPlaces.map((filename) => [`/nested/${filename}`]),
      );
    });

    it("should resolve package.json files with a prettier config", async () => {
      const rootPackageJson = "/package.json";
      const nestedPackageJson = "/nested/package.json";

      mockFileSystem({
        [rootPackageJson]: '{ "prettier": {} }',
        [nestedPackageJson]: "{}",
      });

      const resolver = new Resolver({
        searchPlaces: ["package.json"],
        loader: NOOP_LOADER,
      });

      const result = await resolver.search("/nested");
      
      expect(result).toEqual(rootPackageJson);
      expect(statSpy.mock.calls).toEqual([
        [nestedPackageJson],
        [rootPackageJson],
      ]);
    });
  });

  describe("stopDirectory option", () => {
    it("should climb up the directory tree until it reaches the stopDirectory", async () => {
      mockFileSystem({});

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      const actualConfigFile = await resolver.search("/deeply/nested/directory", {
        stopDirectory: "/deeply/nested",
      });

      expect(actualConfigFile).toBeNull();
      expect(statSpy.mock.calls).toEqual([
        ["/deeply/nested/directory/.prettierrc"],
        ["/deeply/nested/.prettierrc"],
      ]);
    });
  });

  describe("cache option", () => {
    it("should return cached config if cache is set to true", async () => {
      const configFile = "/.prettierrc";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      let result = await resolver.search("/", { cache: true });
      expect(result).toEqual(result);
      expect(statSpy).toHaveBeenCalledTimes(1);

      statSpy.mockClear();

      result = await resolver.search("/", { cache: true });
      expect(result).toEqual(configFile);
      expect(statSpy).toHaveBeenCalledTimes(0);
    });

    it("should previously ignored cached config when cache is set to false", async () => {
      const configFile = "/.prettierrc";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      await resolver.search("/", { cache: true });
      statSpy.mockClear();

      const result = await resolver.search("/", { cache: false });
      expect(result).toEqual(configFile);
      expect(statSpy).toHaveBeenCalledTimes(1);
    });

    it("should resolve nested config even if parent is cached", async () => {
      const rootConfigFile = "/.prettierrc";
      const nestedConfigFile = "/nested/.prettierrc";

      mockFileSystem({
        [rootConfigFile]: "",
        [nestedConfigFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      const rootResult = await resolver.search("/", { cache: true });
      expect(rootResult).toEqual(rootConfigFile);
      
      statSpy.mockClear();

      const nestedResult = await resolver.search("/nested", { cache: true });
      expect(nestedResult).toEqual(nestedConfigFile);
    });

    it("should only lookup config in directories that are not cached", async () => {
      const configFile = "/.prettierrc";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      // Prime cache and clear the stat spy.
      await resolver.search("/", { cache: true });
      statSpy.mockClear();

      const result = await resolver.search("/nested", {
        cache: true,
      });
      expect(result).toEqual(configFile);
      expect(statSpy.mock.calls).toEqual([
        ["/nested/.prettierrc"],
      ]);
    });

    it("should lookup for uncached config when stopDirectory changes", async () => {
      const configFile = "/.prettierrc";

      mockFileSystem({
        [configFile]: "",
      });

      const resolver = new Resolver({
        searchPlaces: [".prettierrc"],
        loader: NOOP_LOADER,
      });

      // Should resolve config because it resides the parent directory compared to the stopDirectory.
      const nonMatchingSearchResult = await resolver.search("/deeply/nested", {
        cache: true,
        stopDirectory: "/deeply",
      });

      expect(nonMatchingSearchResult).toBeNull();
      expect(statSpy.mock.calls).toEqual([
        ["/deeply/nested/.prettierrc"],
        ["/deeply/.prettierrc"],
      ]);

      statSpy.mockClear();

      // Should resolve config, but only lookup in the parent directory because it is cached.
      const matchingSearchResult = await resolver.search("/deeply/nested", {
        cache: true,
        stopDirectory: "/",
      });

      expect(matchingSearchResult).toBe(configFile);
      expect(statSpy.mock.calls).toEqual([
        ["/.prettierrc"],
      ]);
    });
  });
});

describe("Resolver.load", () => {
  it("should invoke the loader with the config file name", async () => {
    const configFile = "/test/.prettierrc";
    const loader = jest.fn(() => Promise.resolve({}));

    const resolver = new Resolver({
      searchPlaces: [],
      loader,
    });

    const result = await resolver.load(configFile);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith(configFile);
    expect(result).toEqual({});
  });

  it("should cache the loaded config when cache is set to true", async () => {
    const configFile = "/test/.prettierrc";
    const loader = jest.fn(() => Promise.resolve({}));

    const resolver = new Resolver({
      searchPlaces: [],
      loader,
    });

    const result = await resolver.load(configFile, { cache: true });
    expect(result).toEqual({});
    expect(loader).toHaveBeenCalledTimes(1);

    loader.mockClear();

    const cachedResult = await resolver.load(configFile, { cache: true });
    expect(result).toEqual(cachedResult);
    expect(loader).toHaveBeenCalledTimes(0);
  });

  it("should not cache the loaded config when cache is set to false", async () => {
    const configFile = "/test/.prettierrc";
    const loader = jest.fn(() => Promise.resolve({}));

    const resolver = new Resolver({
      searchPlaces: [],
      loader,
    });

    const result = await resolver.load(configFile, { cache: true });
    expect(result).toEqual({});
    expect(loader).toHaveBeenCalledTimes(1);

    loader.mockClear();

    const uncachedResult = await resolver.load(configFile, { cache: false });
    expect(uncachedResult).toEqual({});
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe("Resolver.clearCache", () => {
  it("should clear the search cache and force a new search", async () => {
    const configFile = "/.prettierrc";

    mockFileSystem({
      [configFile]: "",
    });

    const resolver = new Resolver({
      searchPlaces: [".prettierrc"],
      loader: NOOP_LOADER,
    });

    let result = await resolver.search("/", { cache: true });
    expect(result).toEqual(configFile);
    expect(statSpy).toHaveBeenCalledTimes(1);

    resolver.clearCache();
    statSpy.mockClear();

    result = await resolver.search("/", { cache: true });
    expect(result).toEqual(configFile);
    expect(statSpy).toHaveBeenCalledTimes(1);
  });

  it("should clear the load cache and force a new load", async () => {
    const configFile = "/test/.prettierrc";
    const loader = jest.fn(() => Promise.resolve({}));

    const resolver = new Resolver({
      searchPlaces: [],
      loader,
    });

    await resolver.load(configFile, { cache: true });
    expect(loader).toHaveBeenCalledTimes(1);

    resolver.clearCache();
    loader.mockClear();

    await resolver.load(configFile, { cache: true });
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
