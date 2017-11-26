import * as fs from "fs";
import * as path from "path";

function readdirAsync(dir: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(dir, (err: NodeJS.ErrnoException, list: string[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(list);
            }
        });
    });
}

function statAsync(file: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
        fs.stat(file, (err: NodeJS.ErrnoException, stats: fs.Stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        });
    });
}

export function iterate(dir: string, filterFn: (file: string, stat: fs.Stats) => boolean): any {
    return readdirAsync(dir).then((list) => {
        return Promise.all(list.map((file) => {
            file = path.resolve(dir, file);
            return statAsync(file).then((stats) => {
                if (stats.isDirectory()) {
                    return filterFn(file, stats) ? iterate(file, filterFn) : "";
                } else {
                    return filterFn(file, stats) ? file : "";
                }
            });
        })).then((results) => {
            return results.filter((f) => {
                return !!f;
            });
        });
    }).then((results: string[]) => {
        return Array.prototype.concat.apply([], results);
    });
}
