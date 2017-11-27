import * as child_process from "child_process";
import * as colors from "colors/safe";
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

    const installAndBuildPackage = (p: IPackage, packages: IPackage[]) => {

        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        // tslint:disable-next-line:no-console
        console.log(colors.bold(colors.blue("Installing: " + p.name)));
        child_process.spawnSync("yarn", ["install", "--checkfiles"], { cwd: p.path, stdio: "inherit" });

        if (_hasDependencies(p, packages)) {

            if (options.build) {
                const buildTarget = options.build instanceof Boolean ? "build" : options.build;
                if (p.scripts[buildTarget] === undefined) { return; }
                // tslint:disable-next-line:no-console
                console.log(colors.bold(colors.blue("Building: " + p.name)));
                child_process.spawnSync("yarn", ["run", buildTarget, "--silent"], { cwd: p.path, stdio: "inherit" });
            }
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

    const linkPackage = (p: IPackage, packages: IPackage[]) => {
        if (_hasDependencies(p, packages)) {
            if (options.packages.length > 0 && !options.packages.includes(p.name)) {
                return;
            }

            if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
                return;
            }

            // tslint:disable-next-line:no-console
            console.log(colors.bold(colors.blue("Linking:" + p.name)));
            child_process.spawnSync("yarn", ["link", "--silent"], { cwd: p.path, stdio: "inherit" });
            const deps = packages.filter((e) => e.dependencies.some((d) => d.name === p.name));
            deps.forEach((d) => {
                child_process.spawnSync("yarn", ["link", p.name, "--silent"], { cwd: d.path, stdio: "inherit" });
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

    const unlinkPackage = (p: IPackage, packages: IPackage[]) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        if (_hasDependencies(p, packages)) {
            const deps = packages.filter((e) => e.dependencies.some((d) => d.name === p.name));
            deps.forEach((d) => {
                child_process.spawnSync("yarn", ["unlink", p.name, "--silent"], { cwd: d.path, stdio: "inherit" });
                child_process.spawnSync("yarn",
                    ["install", "--checkfiles"], { cwd: p.path, stdio: "inherit" });
            });
            // tslint:disable-next-line:no-console
            console.log(colors.bold(colors.blue("Unlinking:" + p.name)));
            child_process.spawnSync("yarn", ["unlink", "--silent"], { cwd: p.path, stdio: "inherit" });
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

    const buildPackage = (p: IPackage, packages: IPackage[]) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        if (p.scripts[target] === undefined) {
            return;
        }

        // tslint:disable-next-line:no-console
        console.log(colors.bold(colors.blue("Execute Task: " + target + " in " + p.name)));
        child_process.spawnSync("yarn", ["run", target], { cwd: p.path, stdio: "inherit" });

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

    const cleanPackage = (p: IPackage, packages: IPackage[]) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }
        // tslint:disable-next-line:forin
        for (const r of options.directories) {
            const pathToDelete = path.join(p.path, r);
            // tslint:disable-next-line:no-console
            console.log(colors.bold(colors.blue("rimraf " + pathToDelete)));
            rimraf(pathToDelete, (err) => {
                if (err) {
                    // tslint:disable-next-line:no-console
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
