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

// todo: I'd love to use these...
type GetProps<C> = C extends React.ComponentType<infer P> ? P : never;
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export function withForm<
    ReturnProps = GetProps<WrappedComponentType>,
    WrappedComponentType = React.ComponentType<ReturnProps>
>(
    Component: React.ComponentType<ReturnProps & FormContext<any>>
): React.ComponentType<ReturnProps> {

    return (props: ReturnProps) => <FormConsumer>
    {
        (context: FormContext<any>) => <Component
            {...props}
            {...context}
        />
    }
    </FormConsumer>
}
