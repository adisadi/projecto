# projecto
yarn project managment utility

- [About](#about)
- [Getting Started](#getting-started)

## About

Splitting up large codebases into separate independently versioned packages
is extremely useful for code sharing. However, making changes across many
repositories is *messy* and difficult to track, and testing across repositories
gets complicated really fast.

To solve these (and many other) problems, some projects will organize their
codebases into multi-package repositories (sometimes called [monorepos](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)). Projects like [Babel](https://github.com/babel/babel/tree/master/packages), [React](https://github.com/facebook/react/tree/master/packages), [Angular](https://github.com/angular/angular/tree/master/modules),
[Ember](https://github.com/emberjs/ember.js/tree/master/packages), [Meteor](https://github.com/meteor/meteor/tree/devel/packages), [Jest](https://github.com/facebook/jest/tree/master/packages), and many others develop all of their packages within a
single repository.

**Projecto is a tool that optimizes the workflow around managing multi-package
repositories with yarn.**


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
`clean` will clean delete folders in all packages.
`task` will execute package.json scripts in all packages.

## Getting Started

Let's start by installing Projecto globally with [npm](https://www.npmjs.com/).

```sh
$ npm install --global projecto
```