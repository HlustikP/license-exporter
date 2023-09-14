#!/usr/bin/env node

import { appendFileSync, existsSync ,readFileSync, writeFileSync } from "node:fs";
import yargs from "yargs";

interface IPackage {
    name: string;
    author?: string;
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
    packagecontents.dependencies = Object.entries(packagecontents.dependencies || {});
    packagecontents.devDependencies = Object.entries(packagecontents.devDependencies || {});
    packagecontents.optionalDependencies = Object.entries(packagecontents.optionalDependencies || {});
    return packagecontents as IPackage;
}

function mergeDependencies(packageInfo: IPackage): IPackage[] {
    return [].concat(packageInfo.dependencies, packageInfo.devDependencies, packageInfo.optionalDependencies);
}

function getDependencyLicenseInfo(all_dependencies: IPackage[], recursive: boolean): IPackage[] {
    let all = [];

    all_dependencies.forEach((p) => {
        const packageinfo = parsePackageInfo(`${args['input']}/node_modules/${p[0]}/package.json`);
        let licensetext = '';
        if (existsSync(`${args['input']}/node_modules/${p[0]}/LICENSE.md`)) {
            licensetext = readFileSync(`${args['input']}/node_modules/${p[0]}/LICENSE.md`, { encoding: 'utf-8' });
        }
        if (existsSync(`${args['input']}/node_modules/${p[0]}/LICENSE`)) {
            licensetext = readFileSync(`${args['input']}/node_modules/${p[0]}/LICENSE`, { encoding: 'utf-8' });
        }
        if (existsSync(`${args['input']}/node_modules/${p[0]}/LICENSE.txt`)) {
            licensetext = readFileSync(`${args['input']}/node_modules/${p[0]}/LICENSE.txt`, { encoding: 'utf-8' });
        }
        const info = {
            author: packageinfo.author,
            repository: packageinfo.repository || (packageinfo.repository as Record<string, string>)?.url,
            description: packageinfo.description,
            name: packageinfo.name,
            license: packageinfo.license,
            version: packageinfo.version,
            licensetext
        };
        all.push(info);
        if (recursive === true) {
            all.push(...getDependencyLicenseInfo(packageinfo.dependencies as IPackage[], true));
        }
    });
    return all;
}
const packageInfo = parsePackageInfo(`${args['input']}/package.json`);
const all = getDependencyLicenseInfo(mergeDependencies(packageInfo), args['recursive']);

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
            `# ${p.name}\n**Author**: ${p.author}\n**Repo**: ${p.repository || (p.repository as Record<string, string>)?.url}\n**License**: ${p.license}\n**Description**: ${p.description}\n## License Text\n${p.licensetext} \n\n`
        );
    });
} else {
    console.log(all);
}
