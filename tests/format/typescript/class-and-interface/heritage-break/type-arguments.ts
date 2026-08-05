class CommentBox extends React.Component<
  { url: string; pollInterval: number },
  CommentData
> {}

interface CommentBox2 extends React.Component<
  { url: string; pollInterval: number },
  CommentData
> {}

declare class CommentBox3 implements React.Component<
  { url: string; pollInterval: number },
  CommentData
> {}
