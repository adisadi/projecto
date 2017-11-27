import * as colors from "colors/safe";
import * as yargs from "yargs";

import { clean, install, link, task, unlink } from "./commands";

const writeDone = () => {
    // tslint:disable-next-line:no-console
    console.log(colors.bold(colors.green("Done")));
};

const argv = yargs.command({
    aliases: ["i"],
    builder: (y) => {
        y.options({
            build: {
                alias: "b",
                describe: "false or custom script name to run",
            },
            nolink: {
                alias: "l",
                boolean: true,
                default: false,
                describe: "link projects after install",
            },
        });
    },
    command: "install [options]",
    desc: "Install and build all packages and link local packages",
    handler: (a) => {

        install({
            build: a.build,
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            link: !a.nolink,
            packages: a.packages,
            root: a.root,
            // tslint:disable-next-line:no-console
        }).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).command({
    aliases: ["t"],
    builder: (y) => {
        y.positional("targets", {
            describe: "package.json script names",
        });
    },
    command: "task <targets...>",
    desc: "exexute script task over all packages",
    handler: (a) => {
        // tslint:disable-next-line:no-console
        task({
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            packages: a.packages,
            root: a.root,
            targets: a.targets,
            // tslint:disable-next-line:no-console
        }).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).command({
    aliases: ["ul"],
    builder: (y) => { return; },
    command: "unlink [options]",
    desc: "Unlink all local packages",
    handler: (a) => {
        // tslint:disable-next-line:no-console
        unlink({
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            packages: a.packages,
            root: a.root,
            // tslint:disable-next-line:no-console
        }).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).command({
    aliases: "l",
    builder: (y) => { return; },
    command: "link [options]",
    desc: "Link all local packages",
    handler: (a) => {
        // tslint:disable-next-line:no-console
        link({
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            packages: a.packages,
            root: a.root,
            // tslint:disable-next-line:no-console
        }).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).command({
    aliases: "c",
    builder: (y) => {
        y.positional("directories", {
            default: ["nodes_modules", "dist"],
            describe: "directories to delete relativ to package root",
        });
    },
    command: "clean [directories...]",
    desc: "Clean Packages (node_modules | dist)",
    handler: (a) => {
        clean(
            {
                directories: a.directories,
                exclude_packages: a.exclude_packages,
                include_root: a.include_root,
                packages: a.packages,
                root: a.root,
            },
            // tslint:disable-next-line:no-console
        ).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).options({
    exclude_packages: {
        alias: "e",
        array: true,
        describe: "exclude these packages",
    },
    include_root: {
        alias: "i",
        boolean: true,
        default: false,
        describe: "include root packages",
    },
    packages: {
        alias: "p",
        array: true,
        describe: "only include these packages",
    },
    root: {
        alias: "r",
        describe: "provide a path to the root",
    },
})
    .demandCommand()
    .help()
    .argv;
