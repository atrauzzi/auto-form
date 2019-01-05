

export type DataItemType<DataType> = DataType extends any[]
    ? DataType[number] | Partial<DataType[number]>
    : DataType | Partial<DataType>;

export type DataOrSetType<DataType> = DataType | DataType[];

export type DataSetType<DataType, DataItem = DataItemType<DataType>> = DataItem[];
