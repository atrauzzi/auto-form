import React from "react";


export interface ComponentProps {

}

export type Props = ComponentProps;

export class FormRemove extends React.Component<Props> {

    public render() {

        return this.props.children;
    }
}
