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
        root: string,
    },
): Promise<void> {

    const defaultOptions = {
        build: "build",
        exclude_packages: [],
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

        if (hasDependencies(p, packages)) {

            if (options.build) {
                const buildTarget = options.build instanceof Boolean ? "build" : options.build;
                if (p.scripts[buildTarget] === undefined) { return; }
                // tslint:disable-next-line:no-console
                console.log(colors.bold(colors.blue("Building: ".cyan + p.name)));
                child_process.spawnSync("yarn", ["run", buildTarget, "--silent"], { cwd: p.path, stdio: "inherit" });
            }
        }
    };

    return executeOnPackage(options.root, installAndBuildPackage).then(() => {
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
        root: string,
    },
): Promise<void> {

    const defaultOptions = {
        exclude_packages: [],
        packages: [],
        root: process.cwd(),
    };

    options = _defaults(options, defaultOptions);

    const linkPackage = (p: IPackage, packages: IPackage[]) => {
        if (hasDependencies(p, packages)) {
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

    return executeOnPackage(options.root, linkPackage);
}

export function unlink(options:
    {
        packages: string[],
        exclude_packages: string[],
        root: string,
    },
): Promise<void> {

    const defaultOptions = {
        exclude_packages: [],
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

        if (hasDependencies(p, packages)) {
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

    return executeOnPackage(options.root, unlinkPackage);
}

export function task(options:
    {
        packages: string[],
        exclude_packages: string[],
        root: string,
        task: string,
    }): Promise<void> {

    const defaultOptions = {
        exclude_packages: [],
        packages: [],
        root: process.cwd(),
        task: "build",
    };

    options = _defaults(options, defaultOptions);

    const buildPackage = (p: IPackage, packages: IPackage[]) => {
        if (options.packages.length > 0 && !options.packages.includes(p.name)) {
            return;
        }

        if (options.exclude_packages.length > 0 && options.exclude_packages.includes(p.name)) {
            return;
        }

        if (p.scripts[options.task] === undefined) {
            return;
        }

        // tslint:disable-next-line:no-console
        console.log(colors.bold(colors.blue("Execute Task:" + options.task)));
        child_process.spawnSync("yarn", ["run", options.task], { cwd: p.path, stdio: "inherit" });

    };

    return executeOnPackage(options.root, buildPackage);
}

export function clean(options:
    {
        root: string,
        packages: string[],
        exclude_packages: string[],
        directories: string[],
    },
): Promise<void> {

    const defaultOptions = {
        directories: ["node_modules", "dist"],
        exclude_packages: [],
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

    return executeOnPackage(options.root, cleanPackage);
}

function hasDependencies(p: IPackage, packages: IPackage[]) {
    return packages.some((e) => e.dependencies.some((d) => d.name === p.name));
}

function _defaults(options, defaultOptions) {
    return Object.assign({}, defaultOptions, filterObject(options));
}

function filterObject(obj) {
    const ret = {};
    Object.keys(obj)
        .filter((key) => obj[key] !== undefined)
        .forEach((key) => ret[key] = obj[key]);
    return ret;
}
