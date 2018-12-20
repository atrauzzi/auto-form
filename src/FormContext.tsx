import * as Yup from "yup";
import React from "react";
import { DataItemType } from "./DataType";


export type ValidationErrors<OriginalData, DataItem = DataItemType<OriginalData>> = { [name in keyof DataItem]?: Yup.ValidationError };

export interface FormContextUtilities<OriginalData, DataItem = DataItemType<OriginalData>> {

    submit(): Promise<void>;
    add(datum: DataItem): Promise<void>;
    setFieldValue(index: number, name: keyof DataItem, value: DataItem[typeof name]): Promise<void>;
}

export interface FormContext<OriginalData> {

    form: FormContextUtilities<OriginalData>;
    immutable: boolean;
    index: number;
    data: OriginalData;
    validationErrors: ValidationErrors<OriginalData>;
    schema?: Yup.Schema<DataItemType<OriginalData>>;
}

export type UsesFormContext<OriginalData> = FormContext<OriginalData>;

const { Provider, Consumer } = React.createContext<FormContext<any>>(null);

export const FormProvider = Provider;
export const FormConsumer = Consumer;

export function withForm<
    Props,
    OriginalData = any
> (
    Component: React.ComponentType<Props & FormContext<OriginalData>>
): React.ReactType<Props> {

    return (props: Props) => <FormConsumer>
    {
        (context: FormContext<OriginalData>) => <Component
            {...props}
            {...context}
        />
    }
    </FormConsumer>
}
