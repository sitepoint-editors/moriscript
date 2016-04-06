module.exports = function(babel) {
  const t = babel.types;

  function moriMethod(name) {
    const expr = t.memberExpression(t.identifier('mori'), t.identifier(name));
    expr.isClean = true;
    return expr;
  }

  return {
    visitor: {
      ObjectExpression(path) {
        const props = path.node.properties.reduce(function(props, prop) {
          return props.concat([t.stringLiteral(prop.key.name), prop.value]);
        }, []);

        path.replaceWith(
          t.callExpression(
            moriMethod('hashMap'),
            props
          )
        );
      },
      ArrayExpression(path) {
        path.replaceWith(
          t.callExpression(
            moriMethod('vector'),
            path.node.elements
          )
        );
      },
      AssignmentExpression(path) {
        const lhs = path.node.left;
        const rhs = path.node.right;

        if(t.isMemberExpression(lhs)) {
          var prop = lhs.property;
          if(t.isIdentifier(lhs.property)) {
            prop = t.stringLiteral(lhs.property.name);
          }

          path.replaceWith(
            t.callExpression(
              moriMethod('assoc'),
              [lhs.object, prop, rhs]
            )
          );
        }
      },
      MemberExpression(path) {
        // if the parent is an assignment expression, handle it elsewhere
        if(t.isAssignmentExpression(path.parent)) return;
        if(path.node.isClean) return;
        if(path.node.object.name == 'console') return;

        if(t.isIdentifier(path.node.property)) {
          path.node.property = t.stringLiteral(path.node.property.name);
        }

        path.replaceWith(
          t.callExpression(
            moriMethod('get'),
            [path.node.object, path.node.property]
          )
        );
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if(t.isMemberExpression(callee)) {
          if(callee.object.name == 'console' && callee.property.name == 'log') {
            path.node.arguments = path.node.arguments.map(function(expr) {
              return t.callExpression(
                moriMethod('toJs'),
                [expr]
              );
            });
          }
        }
      }
    }
  };
};

