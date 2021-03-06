import * as path from "path";
import * as readPkg from "read-pkg";
import { isArray } from "util";
import { exists, iterate } from "./filesystem";

export interface IPackage {
    dependencies: any[];
    name: string;
    path: string;
    scripts: any;
}

function getPackages(rootPath: string, includeRoot: boolean, config: any): Promise<IPackage[]> {

    let exclude = "";

    if (config.excluded && isArray(config.excluded) && config.excluded.length > 0) {
        exclude = "|" + config.excluded.join("|");
    }

    return iterate(rootPath, (f, stat) => {
        if (stat.isDirectory()) {
            return !f.match("node_modules|\\.bin|\\.git" + exclude);
        } else {
            if (!includeRoot && path.join(path.resolve(rootPath), "package.json") === f) { return false; }
            return f.match("package.json") != null;
        }
    }).then((results: any) => {
        return Promise.all(
            results.map((element: string) => {
                if (config.debug && config.debug === true) {
                    console.log(element);
                }

                return readPkg(element).then((pkg: any) => {

                    if (!pkg.dependencies) {
                        return {
                            dependencies: [],
                            name: pkg.name,
                            path: path.dirname(element),
                            scripts: pkg.scripts ? pkg.scripts : {},
                        };
                    }

                    const depNames: string[] = Object.keys(pkg.dependencies);

                    const dep: any[] = [];
                    for (const d of depNames) {
                        if (pkg.dependencies[d].startsWith("file")) {
                            dep.push({ name: d, location: pkg.dependencies[d] });
                        }
                    }

                    return {
                        dependencies: dep,
                        name: pkg.name,
                        path: path.dirname(element),
                        scripts: pkg.scripts ? pkg.scripts : {},
                    } as IPackage;
                });
            }));
    }).then((packages) => {
        packages = packages.sort((p1, p2) => {
            return p1.dependencies.length - p2.dependencies.length;
        });
        return packages;
    });
}

async function getRootConfig(rootPath: string): Promise<any> {

    try {
        const rootPackage = path.join(path.resolve(rootPath), "package.json");
        const rootPackageExists = await exists(rootPackage);
        if (!rootPackageExists) { return {}; }

        const pkg = await readPkg(rootPackage);

        return pkg.projecto ? pkg.projecto : {};

    } catch (err) {
        return {};
    }
}

export async function executeOnPackage(
    rootPath: string,
    includeRoot: boolean,
    fn: (p: IPackage, packages: IPackage[], config: any) => void,
): Promise<void> {

    const config = await getRootConfig(rootPath);
    const packages = await getPackages(rootPath, includeRoot, config);

    const installedPackages: IPackage[] = [];

    const bootstrapFn = (p: IPackage) => {
        fn(p, packages, config);
        installedPackages.push(p);
    };

    const pkgs = packages.filter((p) => p.dependencies.length === 0);
    if (pkgs.length === 0) {
        throw new Error("Can't find a package with no local dependencies! Probably cyclic dependencies!");
    }

    pkgs.forEach((p) => bootstrapFn(p));

    while (installedPackages.length !== packages.length) {
        const pkgs2 = packages.filter((p) => p.dependencies.every((d) => {
            return installedPackages.some((ip) => ip.name === d.name);
        }) && !installedPackages.some((ip) => ip.name === p.name));

        if (pkgs2.length === 0) {
            throw new Error("Can't find Packages with installed " +
                JSON.stringify(installedPackages.map((p) => p.name)) + " dependencies! Probably cyclic dependencies!");
        }

        pkgs2.forEach((p) => bootstrapFn(p));
    }

    return;
}
