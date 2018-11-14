

export type DataItemType<DataType> = DataType extends any[]
    ? DataType[0] | Partial<DataType[0]>
    : DataType | Partial<DataType>;

export type DataOrSetType<DataType> = DataType | DataType[];

export type DataSetType<DataType, DataItem = DataItemType<DataType>> = DataItem[];
