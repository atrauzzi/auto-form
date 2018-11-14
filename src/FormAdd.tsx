import _ from "lodash";
import React from "react";
import { UsesFormContext, withForm } from "./FormContext";


interface ComponentProps<DataType> {

    field: string;

    default?: DataType | (() => DataType);
}

type Props<DataType> = ComponentProps<DataType> & UsesFormContext<DataType>;

class FormAddComponent<DataType> extends React.PureComponent<Props<DataType>> {

    public static defaultProps: Partial<Props<any>> = {
        default: {},
    };

    public render() {

        if (!React.isValidElement(this.props.children)) {

            throw new Error("FormAdd requires a valid React element.");
        }

        const childElement = this.props.children as React.ReactElement<any>;

        return React.cloneElement(
            childElement,
            {
                onClick: () => this.add(),
            }
        );
    }

    public async add() {

        await this.props.form.add(_.result(this.props, 'default'));
    }
}

export const FormAdd = withForm(FormAddComponent);
