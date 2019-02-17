import _ from "lodash";
import React from "react";
import * as Yup from "yup";
import { createDeferred } from "protoculture";
import { UsesFormContext, ValidationErrors, FormProvider, FormContextUtilities } from "./FormContext";
import { DataOrSetType, DataItemType, DataSetType } from "./DataType";
import { AutoWrapper } from "auto-wrapper";


interface ComponentProps<
    OriginalData,
    DataItem = DataItemType<OriginalData>
> {

    form?: Form<OriginalData>;
    index?: number;
    validationErrors?: ValidationErrors<OriginalData>;

    // autoSave?: boolean;

    identityProperties?: (keyof DataItem)[];
    immutable?: boolean;
    // immutable?: boolean | ((data: DataItem) => boolean);

    useFormTag?: boolean;
    name?: string;
    method?: string;
    action?: string;

    onSubmit?(data: OriginalData): any;
    onChange?(editedData: DataItem, dataBeforeEdit?: DataItem): any;
    onInvalid?(errors: ValidationErrors<OriginalData>): any;
}

type Props<OriginalData> = ComponentProps<OriginalData> & UsesFormContext<OriginalData>;

type GetOriginalData<T> = T extends Props<infer P> ? P : never;

interface State<
    PropsType extends Props<any>,
    OriginalData = GetOriginalData<PropsType>,
    DataItem extends DataItemType<OriginalData> = DataItemType<OriginalData>
> {
    collectionSchema: Yup.ArraySchema<DataItemType<OriginalData>>;
    sourceData: OriginalData;
    editedData: DataItem[];
    dataGeneration: {[key: number]: number};
    validationErrors: ValidationErrors<OriginalData>;
}

export class Form<
    OriginalData,
    PropsType extends Props<OriginalData> = Props<OriginalData>,
    StateType extends State<PropsType> = State<PropsType>,
    DataItem = DataItemType<OriginalData>
>
extends React.PureComponent<PropsType, StateType>
implements FormContextUtilities<DataItem> {

    public static defaultProps: ComponentProps<any> = {
        useFormTag: false,
        // autoSave: false,
        immutable: false,
        identityProperties: ["id"],
    };

    public static getDerivedStateFromProps(props: Props<any>, state: State<Props<any>>) {

        if (
            !state 
            || (props.data !== state.sourceData)
        ) {

            return {
                collectionSchema: Form.castSchema(props.schema),
                sourceData: props.data,
                editedData: Form.castData(_.clone(props.data)),
                dataGeneration: {},
                // todo: Should I validate here?
                validationErrors: Form.defaultValidationErrors(props.validationErrors),
            };
        }

        return null;
    }

    private static defaultStructure() {

        return [] as any[];
    }

    private static castData<OriginalData>(value?: DataOrSetType<OriginalData>) {

        if (!value) {

            return Form.defaultStructure() as DataSetType<OriginalData>;
        }

        if (!_.isArray(value)) {

            return [ value ];
        }

        return value;
    }

    private static castSchema(schema: Yup.Schema<any>) {

        if (!schema) {

            return Yup.array();
        }        
        else if (schema.describe().type == "array") {

            return schema as Yup.ArraySchema<any>;
        }
        else {

            return new Yup.array().of(schema);
        }
    }

    private static defaultValidationErrors<OriginalData = any>(validationErrors?: ValidationErrors<OriginalData>): ValidationErrors<OriginalData> {

        return validationErrors || {};
    }

    public render() {

        return this.props.useFormTag
            ? this.renderWithFormTag()
            : this.renderWithoutFormTag()
        ;
    }

    private renderWithFormTag() {

        return <form
            name={this.props.name}
            method={this.props.method}
            action={this.props.action}
        >
            { this.renderData() }
        </form>;
    }

    private renderWithoutFormTag() {

        return this.renderData();
    }

    private renderData(): React.ReactNode {

        if (!this.state.editedData) {

            return null;
        }

        return (this.state.editedData).map((datum, index) => {

            const children: React.ReactNode = this.props.children;

            return (
                <React.Fragment key={this.calculateIdentity(index)}>
                    <FormProvider
                        value={{ 
                            form: this,
                            immutable: this.checkImmutable(datum),
                            index,
                            data: datum,
                            validationErrors: this.state.validationErrors,
                        }}
                    >
                        { children }
                    </FormProvider>
                </React.Fragment>
            );
        });
    }

    public async add(datum: DataItem) {

    }

    public async setFieldValue(index: number, name: keyof DataItem, value?: DataItem[typeof name] | undefined) {

        await this.setStateAsync({
            dataGeneration: {
                ...this.state.dataGeneration,
                [index]: (this.state.dataGeneration[index] || 0) + 1,
            },
        });

        const fieldPath = `[${index}].${name}`;

        if (this.validate(index, name, value)) {

            const originalData = this.state.editedData;
            const editedData = [ ...this.state.editedData ];

            if (_.isUndefined(value)) {

                _.unset(editedData, fieldPath);
            }
            else {

                _.set(editedData, fieldPath, value);
            }

            // note: This could be bad for performance if the change of the entire `editedData` set is causing redraws.
            await this.setStateAsync({
                editedData: editedData,
            });

            await this.clearValidationError(index, name);

            await this.changed(editedData[index], originalData[index]);

            // await this.props.autoSave
            //     ? this.submit(null, index)
            //     : this.changed(index);
        }
        else {

        }

        // if (
        //     !value
        //     && !_.isBoolean(value)
        //     && !_.isArray(value)
        // ) {

        //     await this.clearFieldValue(fieldPath);

        //     return;
        // }
    }

    public async submit() {

        try {

            await this.checkForm();

            const editedData = _.isArray(this.props.data)
                ? this.state.editedData as unknown as OriginalData
                : this.state.editedData[0] as OriginalData;

            this.props.onSubmit && this.props.onSubmit(editedData);
        }
        catch (validationErrors) {

            const indexedValidationErrors = this.indexErrors(validationErrors);
            
            await this.setStateAsync({
                validationErrors: indexedValidationErrors,
            });

            this.props.onInvalid && this.props.onInvalid(this.state.validationErrors);
        }
    }

    private async validate<DataItem = DataItemType<OriginalData>>(index: number, name: keyof DataItem, value: DataItem[typeof name]) {

        if (!this.props.schema) {

            return true;
        }

        const fieldSchema = Yup.reach(this.props.schema, name as string);

        try {

            await fieldSchema.validate(value as any);

            return true;
        }
        catch (error) {

            await this.setValidationError(index, name, error);
        }

        return false;
    }

    private async setValidationError<DataItem = DataItemType<OriginalData>>(index: number, name: keyof DataItem, error: ValidationErrors<OriginalData>) {

        console.log("error::: ", index, name, error);

        const fieldPath = `${index}.${name}`;

        console.log("error::: ", fieldPath, index, name, error);

        const validationErrors = _.clone(this.state.validationErrors);
        _.set(validationErrors, fieldPath, error);

        console.log("set Validation Errors", validationErrors);

        await this.setStateAsync({ validationErrors });

        this.props.onInvalid && this.props.onInvalid(validationErrors);
    }

    private async clearValidationError<DataItem = DataItemType<OriginalData>>(index: number, name: keyof DataItem) {

        const fieldPath = `${index}.${name}`;

        const validationErrors = _.clone(this.state.validationErrors);
        _.unset(validationErrors, fieldPath);

        await this.setStateAsync({ validationErrors });
    }

    public async clearValidationErrors() {

        await this.setStateAsync({
            validationErrors: Form.defaultValidationErrors(),
        });
    }

    // public async clearFieldValue(fieldPath: string) {

    //     const index = parseInt(fieldPath.match(/^\[([0-9]+)\]/)[1], 10);

    //     const newCollection = [
    //         ...this.state.data,
    //     ];

    //     _.unset(newCollection, fieldPath);

    //     await this.setStateAsync({
    //         data: _.filter(newCollection),
    //     });

    //     await this.clearValidationError(fieldPath);

    //     await this.props.autoSave
    //         ? this.submit(null, index)
    //         : this.changed(index);
    // }

    // public getFieldValue(fieldPath: string) {

    //     return _.get(this.state, fieldPath);
    // }

    private async changed(editedItem: DataItemType<OriginalData>, originalItem: DataItemType<OriginalData>) {

        this.props.onChange && this.props.onChange(editedItem, originalItem);
    }

    private async checkForm() {

        if (!this.props.schema) {

            return;
        }

        await this.state.collectionSchema.validate(this.state.editedData, {
            abortEarly: false,
        });

        await this.clearValidationErrors();
    }

    private indexErrors(e: Yup.ValidationError) {

        return _.reduce(
            e.inner,
            (previous, current) => {

                const nextSet = _.clone(previous);
                _.set(nextSet, current.path, current);

                return nextSet;
            },
            Form.defaultValidationErrors()
        );
    }

    private checkImmutable(datum: DataItemType<OriginalData>) {

        if (_.isFunction(this.props.immutable)) {

            return this.props.immutable(datum);
        }

        return this.props.immutable && _.chain(datum as any)
            .pick(this.props.identityProperties)
            .toArray()
            .filter()
            .value()
            .length === this.props.identityProperties.length
            ? "true"
            : "false";
    }

    private calculateIdentity(index: number) {

        return _.chain(this.state.editedData[index] as any)
            .pick(this.props.identityProperties)
            .values()
            .unshift(index)
            .value()
            .join("-");
    }

    private async setStateAsync<K extends keyof StateType>(state: (Pick<StateType, K> | StateType)) {

        const deferred = createDeferred();
        this.setState(state, () => deferred.resolve());
        await deferred.promise;
    }
}
