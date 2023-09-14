#!/usr/bin/env node

// src/index.ts
import {appendFileSync, existsSync, readFileSync, writeFileSync} from "node:fs";
import yargs from "yargs";
var parsePackageInfo = function(path) {
  const packagecontents = JSON.parse(readFileSync(path, { encoding: "utf-8" }));
  packagecontents.dependencies = args["production"] ? Object.entries(packagecontents.dependencies || {}) : [];
  packagecontents.devDependencies = args["dev"] ? Object.entries(packagecontents.devDependencies || {}) : [];
  packagecontents.optionalDependencies = args["optional"] ? Object.entries(packagecontents.optionalDependencies || {}) : [];
  return packagecontents;
};
var mergeDependencies = function(packageInfo) {
  return [].concat(packageInfo.dependencies, packageInfo.devDependencies, packageInfo.optionalDependencies);
};
var getDependencyLicenseInfo = function(initialDependencies, recursive) {
  const all = [];
  const stack = initialDependencies;
  const processedDependencies = new Set;
  while (stack.length > 0) {
    const currentPackage = stack.pop();
    const packageName = currentPackage[0];
    if (processedDependencies.has(packageName)) {
      continue;
    }
    const packageInfo = parsePackageInfo(`${args["input"]}/node_modules/${currentPackage[0]}/package.json`);
    let licensetext = "";
    if (existsSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.md`)) {
      licensetext = readFileSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.md`, { encoding: "utf-8" });
    } else if (existsSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE`)) {
      licensetext = readFileSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE`, { encoding: "utf-8" });
    } else if (existsSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.txt`)) {
      licensetext = readFileSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.txt`, { encoding: "utf-8" });
    }
    const info = {
      author: packageInfo.author ?? "Unspecified",
      repository: (packageInfo.repository || packageInfo.repository?.url) ?? "",
      description: packageInfo.description ?? "Unspecified",
      name: packageInfo.name ?? "Unspecified",
      license: packageInfo.license ?? "Unspecified",
      version: packageInfo.version ?? "Unspecified",
      licensetext
    };
    all.push(info);
    if (recursive === true) {
      const dependencies = mergeDependencies(packageInfo);
      processedDependencies.add(packageName);
      const newDependencies = dependencies.filter((dep) => !processedDependencies.has(dep[0]));
      stack.push(...newDependencies);
    }
  }
  return all;
};
var extractAuthor = function(author) {
  if (typeof author === "string") {
    return author;
  }
  if (author.name) {
    return author.name;
  }
  if (author.url) {
    return author.url;
  }
  if (author.email) {
    return author.email;
  }
  return "";
};
var extractRepository = function(repository) {
  if (typeof repository === "string") {
    return repository;
  }
  if (repository.url) {
    return repository.url;
  }
  return "";
};
var args = yargs(process.argv.slice(2)).option("json", {
  alias: "j",
  description: "Exports the license information into ./licenses.json as json.",
  type: "boolean"
}).option("pretty", {
  alias: "p",
  description: "Prettify the json output.",
  type: "boolean"
}).option("markdown", {
  alias: "m",
  description: "Exports the license information into ./licenses.md as markdown.",
  type: "boolean"
}).option("recursive", {
  alias: "r",
  description: "Include all of the dependencies\' subdependencies.",
  type: "boolean"
}).option("output", {
  alias: "o",
  describe: "Output folder for the exports (Default: Current folder).",
  type: "string",
  default: "."
}).option("input", {
  alias: "i",
  describe: "Path to the input folder containing your package.json and node_modules (Default: Current folder).",
  type: "string",
  default: "."
}).option("production", {
  alias: "prod",
  describe: "Include dependencies.",
  type: "boolean",
  default: true
}).option("dev", {
  alias: "d",
  describe: "Include devDependencies.",
  type: "boolean",
  default: false
}).option("optional", {
  alias: "opt",
  describe: "Include optionalDependencies.",
  type: "boolean",
  default: false
}).help().alias("help", "h").alias("v", "version").argv;
var packageInfo = parsePackageInfo(`${args["input"]}/package.json`);
var initialDependencies = mergeDependencies(packageInfo);
var all = getDependencyLicenseInfo(initialDependencies, args["recursive"]);
if (args["json"]) {
  if (args["pretty"]) {
    writeFileSync(args["output"] + "/licenses.json", JSON.stringify(all, null, 4));
  } else {
    writeFileSync(args["output"] + "/licenses.json", JSON.stringify(all));
  }
}
if (args["markdown"]) {
  writeFileSync(args["output"] + "/licenses.md", "");
  all.forEach((p) => {
    appendFileSync(args["output"] + "/licenses.md", `# ${p.name}\n**Author**: ${extractAuthor(p.author)}\n**Repo**: ${extractRepository(p.repository)}\n**Description**: ${p.description}\n## License Text\n${p.licensetext} \n\n`);
  });
} else {
  console.log(all);
}
