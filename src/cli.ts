import * as colors from "colors/safe";
import * as yargs from "yargs";

import { clean, install, link, task, unlink } from "./commands";

const writeDone = () => {
    console.log(colors.bold(colors.green("Projecto --> done!")));
};

const writeError = (err) => {
    console.error(colors.bold(colors.red("Projecto -->" + err)));
};

const argv = yargs.command({
    aliases: ["i"],
    builder: (y) => {
        y.options({
            build: {
                alias: "b",
                default: "build",
                describe: "Don't build (false) or custom script name to run",
            },
            nolink: {
                alias: "l",
                boolean: true,
                default: false,
                describe: "Don't link local packages",
            },
        });
    },
    command: "install [options]",
    desc: "Install all packages, build local packages with dependencies and link them",
    handler: (a) => {

        install({
            build: a.build,
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            link: !a.nolink,
            packages: a.packages,
            root: a.root,
        }).then(writeDone)
            .catch(writeError);
    },
}).command({
    aliases: ["t"],
    builder: (y) => {
        y.positional("targets", {
            default: [],
            describe: "Package.json script names",
        });
    },
    command: "task <targets...>",
    desc: "Exexute script task over all packages",
    handler: (a) => {
        task({
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            packages: a.packages,
            root: a.root,
            targets: a.targets,
        }).then(writeDone)
            .catch(writeError);
    },
}).command({
    aliases: ["ul"],
    builder: (y) => { return; },
    command: "unlink",
    desc: "Unlink all local packages",
    handler: (a) => {
        unlink({
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            packages: a.packages,
            root: a.root,
        }).then(writeDone)
            .catch(writeError);
    },
}).command({
    aliases: "l",
    builder: (y) => { return; },
    command: "link",
    desc: "Link all local packages",
    handler: (a) => {
        link({
            exclude_packages: a.exclude_packages,
            include_root: a.include_root,
            packages: a.packages,
            root: a.root,
        }).then(writeDone)
            .catch(writeError);
    },
}).command({
    aliases: "c",
    builder: (y) => {
        y.positional("directories", {
            default: ["nodes_modules", "dist"],
            describe: "Directories to delete relativ to package root (glob)",
        });
    },
    command: "clean [directories...]",
    desc: "Delete directories",
    handler: (a) => {
        clean(
            {
                directories: a.directories,
                exclude_packages: a.exclude_packages,
                include_root: a.include_root,
                packages: a.packages,
                root: a.root,
            },
        ).then(writeDone)
            .catch(writeError);
    },
}).options({
    exclude_packages: {
        alias: "e",
        array: true,
        default: [],
        describe: "Exclude these packages",
    },
    include_root: {
        alias: "i",
        boolean: true,
        default: false,
        describe: "Include root packages",
    },
    packages: {
        alias: "p",
        array: true,
        default: [],
        describe: "Only include these packages",
    },
    root: {
        alias: "r",
        default: process.cwd(),
        describe: "Provide a path to the root",
    },
})
    .demandCommand()
    .help()
    .argv;
