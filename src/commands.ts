import chalk from "chalk";
import * as child_process from "child_process";
import * as path from "path";
import * as rimraf from "rimraf";
import { executeOnPackage, IPackage } from "./packages";

export function install(options:
    {
        build: boolean | string,
        link: boolean,
        packages: string[],
        exclude_packages: string[],
        include_root: boolean,
        root: string,
    },
): Promise<void> {

    const defaultOptions = {
        build: "build",
        exclude_packages: [],
        include_root: false,
        link: true,
        packages: [],
        root: process.cwd(),
    };

    options = _defaults(options, defaultOptions);

    const installAndBuildPackage = (p: IPackage, packages: IPackage[], config: any) => {

        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        _print(p.name, "installing");
        child_process.spawnSync("yarn", ["install", "--checkfiles"], { cwd: p.path, stdio: "inherit", shell: true });

        if (options.build) {
            const buildTarget = options.build === true ? "build" : options.build;
            if (p.scripts[buildTarget] === undefined) { return; }

            _print(p.name, "building");
            child_process.spawnSync("yarn", ["run", buildTarget], { cwd: p.path, stdio: "inherit", shell: true });
        }
    };

    return executeOnPackage(options.root, options.include_root, installAndBuildPackage).then(() => {
        if (options.link) {
            return link(options);
        } else {
            return new Promise<void>((resolve) => resolve());
        }
    });
}

export function link(options:
    {
        packages: string[],
        exclude_packages: string[],
        include_root: boolean,
        root: string,
    },
): Promise<void> {

    const defaultOptions = {
        exclude_packages: [],
        include_root: false,
        packages: [],
        root: process.cwd(),
    };

    options = _defaults(options, defaultOptions);

    const linkPackage = (p: IPackage, packages: IPackage[], config: any) => {
        if (_hasDependencies(p, packages)) {
            if (options.packages.length > 0 && !options.packages.includes(p.name)) {
                return;
            }

            if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
                return;
            }

            _print(p.name, "linking");
            child_process.spawnSync(
                "yarn",
                ["link", "--silent"],
                { cwd: p.path, stdio: [process.stdin, process.stdout, "ignore"], shell: true },
            );
            const deps = packages.filter((e) => e.dependencies.some((d) => d.name === p.name));
            deps.forEach((d) => {
                child_process.spawnSync(
                    "yarn", ["link", p.name, "--silent"], { cwd: d.path, stdio: "inherit", shell: true });
            });
        }
    };

    return executeOnPackage(options.root, options.include_root, linkPackage);
}

export function unlink(options:
    {
        packages: string[],
        exclude_packages: string[],
        include_root: boolean,
        root: string,
    },
): Promise<void> {

    const defaultOptions = {
        exclude_packages: [],
        include_root: false,
        packages: [],
        root: process.cwd(),
    };

    options = _defaults(options, defaultOptions);

    const unlinkPackage = (p: IPackage, packages: IPackage[], config: any) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        if (_hasDependencies(p, packages)) {
            const deps = packages.filter((e) => e.dependencies.some((d) => d.name === p.name));
            deps.forEach((d) => {
                child_process.spawnSync(
                    "yarn",
                    ["unlink", p.name, "--silent"],
                    {
                        // tslint:disable-next-line:object-literal-sort-keys
                        cwd: d.path, stdio: [process.stdin, process.stdout, "ignore"], shell: true,
                    });
                child_process.spawnSync("yarn",
                    ["install", "--checkfiles"],
                    { cwd: p.path, stdio: [process.stdin, "ignore", process.stderr], shell: true },
                );
            });

            _print(p.name, "unlinking");
            child_process.spawnSync(
                "yarn",
                ["unlink", "--silent"],
                { cwd: p.path, stdio: [process.stdin, process.stdout, "ignore"], shell: true },
            );
        }
    };

    return executeOnPackage(options.root, options.include_root, unlinkPackage);
}

export function task(options:
    {
        packages: string[],
        exclude_packages: string[],
        include_root: boolean,
        root: string,
        targets: string[],
    }): Promise<void> {

    const defaultOptions = {
        exclude_packages: [],
        include_root: false,
        packages: [],
        root: process.cwd(),
        targets: [],
    };

    options = _defaults(options, defaultOptions);
    let target = "";

    const buildPackage = (p: IPackage, packages: IPackage[], config: any) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        if (p.scripts[target] === undefined) {
            return;
        }

        _print(p.name, "execute task '" + target + "'");
        child_process.spawnSync("yarn", ["run", target], { cwd: p.path, stdio: "inherit", shell: true });

    };

    return new Promise((resolve, reject) => {
        let index = 0;
        function next() {
            if (index < options.targets.length) {
                target = options.targets[index++];
                executeOnPackage(options.root, options.include_root, buildPackage).then(next, reject);
            } else {
                resolve();
            }
        }
        next();
    });
}

export function execute(options:
    {
        packages: string[],
        exclude_packages: string[],
        include_root: boolean,
        root: string,
        cmds: string[],
    }): Promise<void> {

    const defaultOptions = {
        cmds: [],
        exclude_packages: [],
        include_root: false,
        packages: [],
        root: process.cwd(),
    };

    options = _defaults(options, defaultOptions);

    const execPackage = (p: IPackage, packages: IPackage[], config: any) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        _print(p.name, "execute 'yarn " + options.cmds.join(" ") + "'");
        child_process.spawnSync("yarn", options.cmds, { cwd: p.path, stdio: "inherit", shell: true });

    };

    return executeOnPackage(options.root, options.include_root, execPackage);
}

export function clean(options:
    {
        root: string,
        packages: string[],
        exclude_packages: string[],
        include_root: false,
        directories: string[],
    },
): Promise<void> {

    const defaultOptions = {
        directories: ["node_modules", "dist"],
        exclude_packages: [],
        include_root: false,
        packages: [],
        root: process.cwd(),
    };

    options = _defaults(options, defaultOptions);

    const cleanPackage = (p: IPackage, packages: IPackage[], config: any) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        for (const r of options.directories) {
            const pathToDelete = path.join(p.path, r);
            _print("rimraf", "'" + pathToDelete + "'");
            rimraf(pathToDelete, (err) => {
                if (err) {
                    throw err;
                }
            });
        }
    };

    return executeOnPackage(options.root, options.include_root, cleanPackage);
}

function _hasDependencies(p: IPackage, packages: IPackage[]) {
    return packages.some((e) => e.dependencies.some((d) => d.name === p.name));
}

function _defaults(options, defaultOptions) {
    return Object.assign({}, defaultOptions, _filterObject(options));
}

function _filterObject(obj) {
    const ret = {};
    Object.keys(obj)
        .filter((key) => obj[key] !== undefined)
        .forEach((key) => ret[key] = obj[key]);
    return ret;
}

function _print(str1: string, str2: string) {
    console.log(chalk.bold.blueBright(str1) + chalk.yellow(" --> ") + chalk.greenBright(str2));
}
