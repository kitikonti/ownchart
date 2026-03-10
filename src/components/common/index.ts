/**
 * Common reusable components.
 *
 * Export style: value export immediately followed by its companion type export,
 * grouped alphabetically by component name. This keeps the component and its
 * types co-located for easier discovery rather than splitting them into two
 * separate sections at the top/bottom of the file.
 */

export { Alert } from "./Alert";
export type { AlertProps, AlertVariant } from "./Alert";
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";
export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";
export { CheckboxGroup } from "./CheckboxGroup";
export type { CheckboxGroupItem, CheckboxGroupProps } from "./CheckboxGroup";
export { CollapsibleSection } from "./CollapsibleSection";
export type { CollapsibleSectionProps } from "./CollapsibleSection";
export { FieldLabel } from "./FieldLabel";
export type { FieldLabelProps } from "./FieldLabel";
// Shared form control variant type (value map is internal — use Input/Select components)
export type { FormControlVariant } from "./formVariantClasses";
export { Input } from "./Input";
export type { InputProps, InputVariant } from "./Input";
export { LabeledCheckbox } from "./LabeledCheckbox";
export type { LabeledCheckboxProps } from "./LabeledCheckbox";
export { Modal } from "./Modal";
export type { ModalProps, ModalStyleVariant } from "./Modal";
export { Radio } from "./Radio";
export type { RadioProps } from "./Radio";
export { RadioOptionCard } from "./RadioOptionCard";
export type { RadioOptionCardProps } from "./RadioOptionCard";
export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps, SectionHeaderVariant } from "./SectionHeader";
export { SegmentedControl } from "./SegmentedControl";
export type {
  SegmentedControlOption,
  SegmentedControlProps,
} from "./SegmentedControl";
export { Select } from "./Select";
export type { SelectProps, SelectVariant } from "./Select";
