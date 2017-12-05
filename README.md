# projecto
yarn project managment utility

- [About](#about)
- [Getting Started](#getting-started)

## About

**Projecto is a tool that optimizes the workflow around managing multi-package
repositories with yarn.**

It's a Lerna light ;-)

### What does a Projecto repo look like?

There's actually very little to it. You have a file system that looks like this:

```
my-project/
  package.json
  packages/
    package-1/
      package.json
    package-2/
      package.json
```

### What can Projecto do?

`install` will install & build all packages, finally it links all local packages.

`link` will link all local packages.

`unlink` will unlink all local packages.

`clean` will delete folders in all packages.

`task` will execute package.json scripts in all packages.

## Getting Started

Let's start by installing Projecto globally with [npm](https://www.npmjs.com/).

```sh
$ npm install --global projecto
```
or
```sh
$ yarn global add projecto
```

## Help

Just look at the cli help.

```sh
$ po --help
```
or
```sh
$ projecto --help
```