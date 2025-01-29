import {access, presets} from '../lib/exposes';
import * as m from '../lib/modernExtend';
import {DefinitionWithExtend, Fz, ModernExtend, Tz} from '../lib/types';

const pushokExtend = {
    valveStatus: (args?: Partial<m.EnumLookupArgs>) =>
        m.enumLookup({
            name: 'status',
            lookup: {OFF: 0, ON: 1, MOVING: 2, STUCK: 3},
            cluster: 'genMultistateInput',
            attribute: 'presentValue',
            zigbeeCommandOptions: {},
            description: 'Actual valve status',
            access: 'STATE_GET',
            reporting: null,
            ...args,
        }),
    stallTime: (args?: Partial<m.NumericArgs>) =>
        m.numeric({
            name: 'stall_time',
            cluster: 'genMultistateValue',
            attribute: 'presentValue',
            description: 'Timeout for state transition',
            unit: 's',
            access: 'ALL',
            valueMin: 0,
            valueMax: 60,
            valueStep: 1,
            reporting: null,
            ...args,
        }),
    extendedTemperature: (): ModernExtend => {
        const exposes = [presets.numeric('temperature', access.STATE).withUnit('°C').withDescription('Measured temperature value')];
        const fromZigbee: Fz.Converter[] = [
            {
                cluster: 'msTemperatureMeasurement',
                type: ['attributeReport', 'readResponse'],
                convert: (model, msg, publish, options, meta) => {
                    if (msg.data['measuredValue'] !== undefined) {
                        let temperature = msg.data.measuredValue / 100.0;

                        if (msg.data[0xf001] !== undefined) {
                            temperature += msg.data[0xf001] / 10.0;
                        }
                        return {temperature};
                    }
                    return {};
                },
            },
        ];
        const toZigbee: Tz.Converter[] = [];
        return {
            exposes,
            fromZigbee,
            toZigbee,
            isModernExtend: true,
        };
    },
};

const definitions: DefinitionWithExtend[] = [
    {
        zigbeeModel: ['POK001'],
        model: 'POK001',
        vendor: 'PushOk Hardware',
        description: 'Battery powered retrofit valve',
        extend: [
            m.onOff({powerOnBehavior: false, configureReporting: false}),
            m.battery({percentage: true, voltage: true, lowStatus: true, percentageReporting: false}),
            pushokExtend.valveStatus(),
            m.identify({isSleepy: true}),
            m.enumLookup({
                name: 'kamikaze',
                lookup: {OFF: 0, ON: 1},
                cluster: 'genBinaryValue',
                attribute: 'presentValue',
                zigbeeCommandOptions: {},
                description: 'Allow operation on low battery (can destroy battery)',
                access: 'ALL',
                reporting: null,
            }),
            pushokExtend.stallTime(),
            m.enumLookup({
                name: 'battery_type',
                lookup: {LIION: 0, ALKALINE: 1, NIMH: 2},
                cluster: 'genMultistateOutput',
                attribute: 'presentValue',
                zigbeeCommandOptions: {},
                description: 'Battery type',
                access: 'ALL',
                reporting: null,
            }),
            m.numeric({
                name: 'end_lag',
                cluster: 'genAnalogValue',
                attribute: 'presentValue',
                description: 'Endstop lag angle (wrong value can cause damage)',
                unit: '°',
                access: 'ALL',
                valueMin: 0,
                valueMax: 15,
                valueStep: 1,
                reporting: null,
            }),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK002', 'POK007'],
        model: 'POK002_POK007',
        vendor: 'PushOk Hardware',
        description: 'Soil moisture and temperature sensor',
        extend: [
            m.humidity({reporting: null}),
            m.temperature({reporting: null}),
            m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false}),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK003'],
        model: 'POK003',
        vendor: 'PushOk Hardware',
        description: 'Water level and temperature sensor',
        extend: [
            m.binary({
                name: 'contact',
                valueOn: ['ON', 0x01],
                valueOff: ['OFF', 0x00],
                cluster: 'genBinaryInput',
                attribute: 'presentValue',
                description: 'Indicates if the contact is closed (= true) or open (= false)',
                access: 'STATE_GET',
                reporting: null,
            }),
            m.temperature({reporting: null}),
            m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false}),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK004'],
        model: 'POK004',
        vendor: 'PushOk Hardware',
        description: 'Solar powered zigbee router and illuminance sensor',
        extend: [m.illuminance({reporting: null}), m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false})],
        ota: true,
    },
    {
        zigbeeModel: ['POK005'],
        model: 'POK005',
        vendor: 'PushOk Hardware',
        description: 'Temperature and Humidity sensor',
        extend: [
            m.humidity({reporting: null}),
            m.temperature({reporting: null}),
            m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false}),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK006'],
        model: 'POK006',
        vendor: 'PushOk Hardware',
        description: 'Battery powered garden valve',
        extend: [
            m.onOff({powerOnBehavior: false, configureReporting: false}),
            m.battery({percentage: true, voltage: true, lowStatus: true, percentageReporting: false}),
            pushokExtend.valveStatus(),
            m.identify({isSleepy: true}),
            pushokExtend.stallTime(),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK008'],
        model: 'POK008',
        vendor: 'PushOk Hardware',
        description: 'Battery powered thermostat relay',
        extend: [
            m.onOff({powerOnBehavior: false, configureReporting: false}),
            m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false}),
            m.temperature({reporting: null}),
            m.numeric({
                name: 'tgt_temperature',
                cluster: 'genAnalogOutput',
                attribute: 'presentValue',
                description: 'Target temperature',
                unit: 'C',
                access: 'ALL',
                valueMin: -45,
                valueMax: 125,
                valueStep: 1,
                reporting: null,
            }),
            m.numeric({
                name: 'hysteresis',
                cluster: 'genAnalogValue',
                attribute: 'presentValue',
                description: 'Temperature hysteresis',
                unit: 'C',
                access: 'ALL',
                valueMin: 0.1,
                valueMax: 40,
                valueStep: 0.1,
                reporting: null,
            }),
            m.enumLookup({
                name: 'set_op_mode',
                lookup: {monitor: 0, heater: 1, cooler: 2, monitor_inverted: 3, heater_inverted: 4, cooler_inverted: 5},
                cluster: 'genMultistateOutput',
                attribute: 'presentValue',
                zigbeeCommandOptions: {},
                description: 'Operation mode',
                access: 'ALL',
                reporting: null,
            }),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK009'],
        model: 'POK009',
        vendor: 'PushOk Hardware',
        description: 'Voltage monitor',
        extend: [
            m.numeric({
                name: 'ext_voltage',
                cluster: 'genAnalogInput',
                attribute: 'presentValue',
                description: 'Mains voltage',
                unit: 'V',
                precision: 1,
                access: 'STATE_GET',
                reporting: null,
            }),
            m.binary({
                name: 'comp_state',
                valueOn: ['NORMAL', 0x01],
                valueOff: ['LOW', 0x00],
                cluster: 'genBinaryInput',
                attribute: 'presentValue',
                description: 'Voltage status',
                access: 'STATE_GET',
                reporting: null,
            }),
            m.numeric({
                name: 'tgt_voltage',
                cluster: 'genMultistateValue',
                attribute: 'presentValue',
                description: 'Voltage threshold',
                unit: 'V',
                access: 'ALL',
                valueMin: 4,
                valueMax: 340,
                valueStep: 1,
                reporting: null,
            }),
            m.enumLookup({
                name: 'voltage_type',
                lookup: {AC: 0, DC: 1},
                cluster: 'genMultistateOutput',
                attribute: 'presentValue',
                zigbeeCommandOptions: {},
                description: 'Mode',
                access: 'ALL',
                reporting: null,
            }),
            m.identify({isSleepy: true}),
            m.battery({percentage: true, voltage: true, lowStatus: true, percentageReporting: false}),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK010'],
        model: 'POK010',
        vendor: 'PushOk Hardware',
        description: 'Water level and temperature sensor',
        extend: [
            m.binary({
                name: 'contact',
                valueOn: ['ON', 0x01],
                valueOff: ['OFF', 0x00],
                cluster: 'genBinaryInput',
                attribute: 'presentValue',
                description: 'Indicates if the contact is closed (= true) or open (= false)',
                access: 'STATE_GET',
                reporting: null,
            }),
            m.temperature({reporting: null}),
            m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false}),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK011'],
        model: 'POK011',
        vendor: 'PushOk Hardware',
        description: 'Illuminance sensor',
        extend: [m.illuminance({reporting: null}), m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false})],
        ota: true,
    },
    {
        zigbeeModel: ['POK012'],
        model: 'POK012',
        vendor: 'PushOk Hardware',
        description: '20 dBm Zigbee router with battery backup for indoor/outdoor use',
        extend: [
            m.enumLookup({
                name: 'battery_state',
                lookup: {missing: 0, charging: 1, full: 2, discharging: 3},
                cluster: 'genMultistateInput',
                attribute: 'presentValue',
                zigbeeCommandOptions: {},
                description: 'Battery state',
                access: 'STATE_GET',
                reporting: null,
            }),
            m.iasZoneAlarm({
                zoneType: 'generic',
                zoneAttributes: ['ac_status', 'battery_defect'],
                alarmTimeout: false,
            }),
            m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false}),
        ],
        ota: true,
    },
    {
        zigbeeModel: ['POK014'],
        model: 'POK014',
        vendor: 'PushOk Hardware',
        description: 'External probe temperature sensor: k-type',
        extend: [pushokExtend.extendedTemperature(), m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false})],
        ota: true,
    },
    {
        zigbeeModel: ['POK015'],
        model: 'POK015',
        vendor: 'PushOk Hardware',
        description: 'External probe temperature sensor: pt1000',
        extend: [pushokExtend.extendedTemperature(), m.battery({percentage: true, voltage: true, lowStatus: false, percentageReporting: false})],
        ota: true,
    },
];

export default definitions;
module.exports = definitions;
