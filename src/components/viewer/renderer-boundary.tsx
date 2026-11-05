"use client";
import { Component, type ReactNode } from "react";
type Props = { content: string; format: string; children: ReactNode };
export class RendererBoundary extends Component<
  Props,
  { failed: boolean; content: string; format: string }
> {
  state = {
    failed: false,
    content: this.props.content,
    format: this.props.format,
  };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(
    props: Props,
    state: { content: string; format: string },
  ) {
    if (props.content !== state.content || props.format !== state.format)
      return { failed: false, content: props.content, format: props.format };
    return null;
  }
  render() {
    return this.state.failed ? (
      <div>
        <p className="message message-error" role="alert">
          Ce contenu ne peut pas être affiché avec ce visualiseur. La source est
          conservée ; vous pouvez choisir un autre format.
        </p>
        <pre className="document-source">{this.props.content}</pre>
      </div>
    ) : (
      this.props.children
    );
  }
}
