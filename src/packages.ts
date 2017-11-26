import * as path from "path";
import * as readPkg from "read-pkg";
import { iterate } from "./filesystem";

export interface IPackage {
    dependencies: any[];
    name: string;
    path: string;
    scripts: any;
}

function getPackages(rootPath: string): Promise<IPackage[]> {
    return iterate(".", (f, stat) => {
        if (stat.isDirectory()) {
            return !f.match("node_modules|.bin|.git");
        } else {
            return f.match("package.json") != null;
        }
    }).then((results: any) => {
        return Promise.all(
            results.map((element: string) => {
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

export function executeOnPackage(rootPath: string, fn: (p: IPackage, packages: IPackage[]) => void): Promise<void> {
    return getPackages(rootPath).then((packages) => {

        const installedPackages: IPackage[] = [];

        const bootstrapFn = (p: IPackage) => {
            fn(p, packages);
            installedPackages.push(p);
        };

        const pkgs = packages.filter((p) => p.dependencies.length === 0);
        if (pkgs.length === 0) {
            throw new Error("Cyclic Deps!");
        }

        pkgs.forEach((p) => bootstrapFn(p));

        while (installedPackages.length !== packages.length) {
            const pkgs2 = packages.filter((p) => p.dependencies.every((d) => {
                return installedPackages.some((ip) => ip.name === d.name);
            }) && !installedPackages.some((ip) => ip.name === p.name));

            if (pkgs2.length === 0) {
                throw new Error("Cyclic Deps!");
            }

            pkgs2.forEach((p) => bootstrapFn(p));
        }

        return;
    });
}
