/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Documentation, { type DocumentationObject } from './Documentation';
import postProcessDocumentation from './utils/postProcessDocumentation';

import buildParser, { type Options } from './babelParser';
import recast from 'recast';
import type { Handler, Resolver } from './types';

const ERROR_MISSING_DEFINITION = 'No suitable component definition found.';

function executeHandlers(
  handlers: Array<Handler>,
  componentDefinitions: Array<NodePath>,
): Array<DocumentationObject> {
  return componentDefinitions.map(
    (componentDefinition): DocumentationObject => {
      const documentation = new Documentation();
      handlers.forEach(handler => handler(documentation, componentDefinition));
      return postProcessDocumentation(documentation.toObject());
    },
  );
}

/**
 * Takes JavaScript source code and returns an object with the information
 * extract from it.
 *
 * `resolver` is a strategy to find the AST node(s) of the component
 * definition(s) inside `src`.
 * It is a function that gets passed the program AST node of
 * the source as first argument, and a reference to recast as second argument.
 *
 * This allows you define your own strategy for finding component definitions.
 *
 * `handlers` is an array of functions which are passed a reference to the
 * component definitions (extracted by `resolver`) so that they can extract
 * information from it. They get also passed a reference to a `Documentation`
 * object to attach the information to.
 *
 * If `resolver` returns an array of component definitions, `parse` will return
 * an array of documentation objects. If `resolver` returns a single node
 * instead, `parse` will return a documentation object.
 */
export default function parse(
  src: string,
  resolver: Resolver,
  handlers: Array<Handler>,
  options: Options,
): Array<DocumentationObject> | DocumentationObject {
  const ast = recast.parse(src, { parser: buildParser(options) });
  const componentDefinitions = resolver(ast.program, recast);

  if (Array.isArray(componentDefinitions)) {
    if (componentDefinitions.length === 0) {
      throw new Error(ERROR_MISSING_DEFINITION);
    }
    return executeHandlers(handlers, componentDefinitions);
  } else if (componentDefinitions) {
    return executeHandlers(handlers, [componentDefinitions])[0];
  }

  throw new Error(ERROR_MISSING_DEFINITION);
}

export { ERROR_MISSING_DEFINITION };
