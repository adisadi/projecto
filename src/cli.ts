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
            exclude_packages: {
                alias: "e",
                array: true,
                describe: "exclude these projects and their dependencies",
            },
            link: {
                alias: "l",
                describe: "link projects after install",
            },
            packages: {
                alias: "p",
                array: true,
                describe: "only include these projects and their dependencies",
            },
            root: {
                alias: "r",
                describe: "provide a path to the root",
            },
        });
    },
    command: "install [options]",
    desc: "Install and build all packages and link local packages",
    handler: (a) => {

        install({
            build: a.build,
            exclude_packages: a.exclude_packages,
            link: a.link,
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
        y.option({
            exclude_packages: {
                alias: "e",
                describe: "exclude these projects and their dependencies",
            },
            packages: {
                alias: "p",
                describe: "only include these projects and their dependencies",
            },
            root: {
                alias: "r",
                describe: "provide a path to the root",
            },
            task: {
                alias: "t",
                describe: "false or custom script name to run",
            },
        });
    },
    command: "task [options]",
    desc: "exexute script task over all packages",
    handler: (a) => {
        // tslint:disable-next-line:no-console
        task({
            exclude_packages: a.exclude_packages,
            packages: a.packages,
            root: a.root,
            task: a.task,
            // tslint:disable-next-line:no-console
        }).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).command({
    aliases: ["ul"],
    builder: (y) => {
        y.option({
            exclude_packages: {
                alias: "e",
                describe: "exclude these projects and their dependencies",
            },
            packages: {
                alias: "p",
                describe: "only include these projects and their dependencies",
            },
            root: {
                alias: "r",
                describe: "provide a path to the root",
            },
        });
    },
    command: "unlink [options]",
    desc: "Unlink all local packages",
    handler: (a) => {
        // tslint:disable-next-line:no-console
        unlink({
            exclude_packages: a.exclude_packages,
            packages: a.packages,
            root: a.root,
            // tslint:disable-next-line:no-console
        }).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
}).command({
    aliases: "l",
    builder: (y) => {
        y.option({
            exclude_packages: {
                alias: "e",
                describe: "exclude these projects and their dependencies",
            },
            packages: {
                alias: "p",
                describe: "only include these projects and their dependencies",
            },
            root: {
                alias: "r",
                describe: "provide a path to the root",
            },
        });
    },
    command: "link [options]",
    desc: "Link all local packages",
    handler: (a) => {
        // tslint:disable-next-line:no-console
        link({
            exclude_packages: a.exclude_packages,
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
        y.option({
            directories: {
                alias: "d",
                array: true,
                describe: "array with directories to delete",
            },
            exclude_packages: {
                alias: "e",
                array: true,
                describe: "exclude these projects and their dependencies",
            },
            packages: {
                alias: "p",
                array: true,
                describe: "only include these projects and their dependencies",
            },
            root: {
                alias: "r",
                describe: "provide a path to the root",
            },
        });
    },
    command: "clean [options]",
    desc: "Clean Packages (node_modules | dist)",
    handler: (a) => {
        clean(
            {
                directories: a.directories,
                exclude_packages: a.exclude_packages,
                packages: a.packages,
                root: a.root,
            },
            // tslint:disable-next-line:no-console
        ).then(writeDone)
            // tslint:disable-next-line:no-console
            .catch((err) => console.error(colors.red(err)));
    },
})
    .demandCommand()
    .help()
    .argv;
