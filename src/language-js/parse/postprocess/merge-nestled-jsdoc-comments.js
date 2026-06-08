import { locEnd, locStart } from "../../location/index.js";
import {
  isBlockComment,
  isLineComment,
} from "../../utilities/comment-types.js";
import {
  deleteIndentableBlockCommentLines,
  isIndentableBlockComment,
} from "../../utilities/indentable-block-comment.js";

function mergeNestledJsdocComments(comments) {
  if (comments.length < 2) {
    return;
  }

  let followingComment;
  for (
    let commentIndex = comments.length - 1;
    commentIndex >= 0;
    commentIndex--
  ) {
    const comment = comments[commentIndex];

    if (
      followingComment &&
      locEnd(comment) === locStart(followingComment) &&
      isIndentableBlockComment(comment) &&
      isIndentableBlockComment(followingComment)
    ) {
      comments.splice(i + 1, 1);
      comment.value += "*//*" + followingComment.value;
      comment.range = [locStart(comment), locEnd(followingComment)];

      // delete cache
      deleteIndentableBlockCommentLines(comment);
    }

    /* c8 ignore next 3 */
    if (!isLineComment(comment) && !isBlockComment(comment)) {
      throw new TypeError(`Unknown comment type: "${comment.type}".`);
    }

    followingComment = comment;
  }
}

export { mergeNestledJsdocComments };
