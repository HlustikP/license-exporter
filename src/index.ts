#!/usr/bin/env node

import { appendFileSync, existsSync ,readFileSync, writeFileSync } from "node:fs";
import yargs from "yargs";

interface IPackage {
    name: string;
    author?: string | { name?: string, url?: string, email?: string }
    repository?: string | { url: string };
    description?: string;
    license?: string;
    version?: string;
    licensetext?: string;
    dependencies?: Record<string, string>[] | IPackage[];
    optionalDependencies?: Record<string, string>[] | IPackage[];
    devDependencies?: Record<string, string>[] | IPackage[];
}

const args = yargs(process.argv.slice(2))
    .option('json', {
        alias: 'j',
        description: 'Exports the license information into ./licenses.json as json.',
        type: 'boolean',
    })
    .option('pretty', {
        alias: 'p',
        description: 'Prettify the json output.',
        type: 'boolean',
    })
    .option('markdown', {
        alias: 'm',
        description: 'Exports the license information into ./licenses.md as markdown.',
        type: 'boolean',
    })
    .option('recursive', {
        alias: 'r',
        description: 'Include all of the dependencies\' subdependencies.',
        type: 'boolean',
    })
    .option('output', {
        alias : 'o',
        describe: 'Output folder for the exports (Default: Current folder).',
        type: 'string',
        default: '.'
    })
    .option('input', {
        alias : 'i',
        describe: 'Path to the input folder containing your package.json and node_modules (Default: Current folder).',
        type: 'string',
        default: '.'
    })
    .option('production', {
        alias : 'prod',
        describe: 'Include dependencies.',
        type: 'boolean',
        default: true
    })
    .option('dev', {
        alias : 'd',
        describe: 'Include devDependencies.',
        type: 'boolean',
        default: false
    })
    .option('optional', {
        alias : 'opt',
        describe: 'Include optionalDependencies.',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h')
    .alias('v', 'version')
    .argv;

function parsePackageInfo(path: string): IPackage {
    const packagecontents: Record<string, any> = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));
    packagecontents.dependencies = args['production'] ? Object.entries(packagecontents.dependencies || {}) : [];
    packagecontents.devDependencies = args['dev'] ? Object.entries(packagecontents.devDependencies || {}) : [];
    packagecontents.optionalDependencies = args['optional'] ? Object.entries(packagecontents.optionalDependencies || {}) : [];
    return packagecontents as IPackage;
}

function mergeDependencies(packageInfo: IPackage): IPackage[] {
    return [].concat(packageInfo.dependencies, packageInfo.devDependencies, packageInfo.optionalDependencies);
}

function getDependencyLicenseInfo(
    initialDependencies: IPackage[],
    recursive: boolean
): IPackage[] {
    const all: IPackage[] = [];
    const stack: IPackage[] = initialDependencies;
    // Keeps track of processed dependencies to avoid duplicates
    const processedDependencies: Set<string> = new Set();

    while (stack.length > 0) {
        const currentPackage = stack.pop()!;
        const packageName = currentPackage[0];

        // Check if this dependency has already been processed
        if (processedDependencies.has(packageName)) {
            // Skip processing this dependency again
            continue;
        }

        const packageInfo = parsePackageInfo(
            `${args["input"]}/node_modules/${currentPackage[0]}/package.json`
        );

        let licensetext = "";
        if (
            existsSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.md`)
        ) {
            licensetext = readFileSync(
                `${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.md`,
                { encoding: "utf-8" }
            );
        } else if (
            existsSync(`${args["input"]}/node_modules/${currentPackage[0]}/LICENSE`)
        ) {
            licensetext = readFileSync(
                `${args["input"]}/node_modules/${currentPackage[0]}/LICENSE`,
                { encoding: "utf-8" }
            );
        } else if (
            existsSync(
                `${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.txt`
            )
        ) {
            licensetext = readFileSync(
                `${args["input"]}/node_modules/${currentPackage[0]}/LICENSE.txt`,
                { encoding: "utf-8" }
            );
        }

        const info = {
            author: packageInfo.author ?? "Unspecified",
            repository: (packageInfo.repository || (packageInfo.repository as Record<string, string>)?.url) ?? "",
            description: packageInfo.description ?? "Unspecified",
            name: packageInfo.name ?? "Unspecified",
            license: packageInfo.license ?? "Unspecified",
            version: packageInfo.version ?? "Unspecified",
            licensetext,
        };

        all.push(info);

        if (recursive === true) {
            // Add this package's dependencies to the stack for processing
            const dependencies = mergeDependencies(packageInfo);

            // Mark this dependency as processed
            processedDependencies.add(packageName);

            // Filter out dependencies that have already been processed
            const newDependencies = dependencies.filter(
                (dep) => !processedDependencies.has(dep[0])
            );

            stack.push(...newDependencies);
        }
    }
    return all;
}

const packageInfo = parsePackageInfo(`${args["input"]}/package.json`);
const initialDependencies = mergeDependencies(packageInfo);
const all = getDependencyLicenseInfo(initialDependencies, args["recursive"]);

function extractAuthor(author: string | { name?: string, url?: string, email?: string }): string {
    if (typeof author === 'string') {
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
    return '';
}

function extractRepository(repository: string | { url: string }): string {
    if (typeof repository === 'string') {
        return repository;
    }
    if (repository.url) {
        return repository.url;
    }
    return '';
}

if (args['json']) {
    if (args['pretty']) {
        writeFileSync((args['output']+'/licenses.json'), JSON.stringify(all, null, 4));
    } else {
        writeFileSync((args['output']+'/licenses.json'), JSON.stringify(all));
    }
}
if (args['markdown']) {
    writeFileSync((args['output']+'/licenses.md'), '');
    all.forEach((p) => {
        appendFileSync(
            (args['output']+'/licenses.md'),
            `# ${p.name}\n**Author**: ${extractAuthor(p.author)}\n**Repo**: ${extractRepository(p.repository)}\n**Description**: ${p.description}\n## License Text\n${p.licensetext} \n\n`
        );
    });
} else {
    console.log(all);
}
