# Change Log

All notable changes to the "better-search" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.3] - 2019-03-12

- Fixes an issue with shell escaping that could cause search to return zero results on some platforms or with some queries
- Fixes an issue where keybindings were too loosely scoped and would fire outside of an editor context

## [0.0.2] - 2019-03-12

- Fixes a critical bug where the extension only worked under x86 Linux. The extension now installs a ripgrep binary appropriate to the detected platform and architecture

## [0.0.1] - 2019-03-10

- Initial release
