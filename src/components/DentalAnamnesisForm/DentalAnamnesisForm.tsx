import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

export type ToothBrushingFrequency =
    | ''
    | '1 vez'
    | '2 vezes'
    | '3 ou mais vezes';

export interface DentalAnamnesisValues {
    gum_bleeding: boolean;
    floss_usage: boolean;
    bruxism_clenching: boolean;
    tooth_brushing_frequency: ToothBrushingFrequency;
    chief_dental_complaint: string;
}

interface Props {
    values: DentalAnamnesisValues;
    onChange: <K extends keyof DentalAnamnesisValues>(
        key: K,
        value: DentalAnamnesisValues[K],
    ) => void;
}

export default function DentalAnamnesisForm({ values, onChange }: Props) {
    const handleFrequencyChange = (event: SelectChangeEvent) => {
        onChange(
            'tooth_brushing_frequency',
            event.target.value as ToothBrushingFrequency,
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            <Stack spacing={2}>
                <Box>
                    <Typography variant='overline' color='text.secondary'>
                        Cadastro
                    </Typography>
                    <Typography variant='h6'>Anamnese Odontologia</Typography>
                </Box>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={values.gum_bleeding}
                            onChange={e =>
                                onChange('gum_bleeding', e.target.checked)
                            }
                        />
                    }
                    label='Gengiva sangra ao escovar'
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={values.floss_usage}
                            onChange={e =>
                                onChange('floss_usage', e.target.checked)
                            }
                        />
                    }
                    label='Usa fio dental diariamente'
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={values.bruxism_clenching}
                            onChange={e =>
                                onChange('bruxism_clenching', e.target.checked)
                            }
                        />
                    }
                    label='Ranger/Apertar dentes'
                />

                <FormControl fullWidth size='small'>
                    <InputLabel id='tooth-brushing-frequency-label'>
                        Frequencia de escovacao
                    </InputLabel>
                    <Select
                        labelId='tooth-brushing-frequency-label'
                        label='Frequencia de escovacao'
                        value={values.tooth_brushing_frequency}
                        onChange={handleFrequencyChange}
                    >
                        <MenuItem value=''>Selecione</MenuItem>
                        <MenuItem value='1 vez'>1 vez</MenuItem>
                        <MenuItem value='2 vezes'>2 vezes</MenuItem>
                        <MenuItem value='3 ou mais vezes'>
                            3 ou mais vezes
                        </MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label='Queixa principal bucal'
                    placeholder='Descreva a queixa principal do paciente...'
                    value={values.chief_dental_complaint}
                    onChange={e =>
                        onChange('chief_dental_complaint', e.target.value)
                    }
                />
            </Stack>
        </Paper>
    );
}
