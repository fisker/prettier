const visitorKeys = {
  "front-matter": [],
  "css-root": ["frontMatter", "nodes"],
  "css-comment": [],
  "css-rule": ["selector", "nodes"],
  "css-decl": ["value", "selector", "nodes"],
  "css-atrule": ["selector", "params", "value", "nodes"],
  "media-query-list": ["nodes"],
  "media-query": ["nodes"],
  "media-type": [],
  "media-feature-expression": ["nodes"],
  "media-feature": [],
  "media-colon": [],
  "media-value": [],
  "media-keyword": [],
  "media-url": [],
  "media-unknown": [],
  "selector-root": ["nodes"],
  "selector-selector": ["nodes"],
  "selector-comment": [],
  "selector-string": [],
  "selector-tag": [],
  "selector-id": [],
  "selector-class": [],
  "selector-attribute": [],
  "selector-combinator": ["nodes"],
  "selector-universal": [],
  "selector-pseudo": ["nodes"],
  "selector-nesting": [],
  "selector-unknown": [],
  "value-value": ["group"],
  "value-root": ["group"],
  "value-comment": [],
  "value-comma_group": ["groups"],
  "value-paren_group": ["open", "groups", "close"],
  "value-func": ["group"],
  "value-paren": [],
  "value-number": [],
  "value-operator": [],
  "value-word": [],
  "value-colon": [],
  "value-comma": [],
  "value-string": [],
  "value-atword": [],
  "value-unicode-range": [],
  "value-unknown": [],

  "value-numeric": [],
  "value-punctuation": [],
  "value-quoted": [],
};

export default visitorKeys;
