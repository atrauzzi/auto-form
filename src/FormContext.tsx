import _ from "lodash";
import * as Yup from "yup";
import React from "react";
import { DataItemType } from "./DataType";
import { Omit } from "protoculture";


export type ValidationErrors<DataType, DataItem = DataItemType<DataType>> = { [name in keyof DataItem]?: Yup.ValidationError };

export interface FormContextUtilities<DataType, DataItem = DataItemType<DataType>> {

    submit(): Promise<void>;
    add(datum: DataItem): Promise<void>;
    setFieldValue(index: number, name: keyof DataItem, value: DataItem[typeof name]): Promise<void>;
}

export interface FormContext<DataType> {

    form: FormContextUtilities<DataType>;
    immutable: boolean;
    index: number;
    data: DataType;
    validationErrors: ValidationErrors<DataType>;
    schema?: Yup.Schema<DataItemType<DataType>>;
}

export type UsesFormContext<DataType> = FormContext<DataType>;

const { Provider, Consumer } = React.createContext<FormContext<any>>(null);

export const FormProvider = Provider;
export const FormConsumer = Consumer;

export type GetProps<C> = C extends React.ComponentType<infer P> ? P : never;

export function withForm<
    DataType,
    RequiredProps extends FormContext<DataType>,
    FormComponentType extends React.ComponentType<RequiredProps>,
    FormComponentProps extends RequiredProps = GetProps<FormComponentType>,
    WrappedComponentProps = Omit<FormComponentProps, keyof RequiredProps>
>
(FormComponent: React.ComponentType<FormContext<DataType>>) {

    return (props: WrappedComponentProps) => <FormConsumer>
    {
        (context: FormContext<DataType>) => <FormComponent
            {...context}
            {...props}
        />
    }
    </FormConsumer>
}
