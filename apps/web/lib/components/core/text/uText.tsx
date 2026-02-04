"use client";

import { forwardRef, useMemo } from "react";
import { Text, type TamaguiTextElement, type TextProps } from "tamagui";

import { type TextVariant } from "./textVariant";
import { getVariantStyle } from "./textStyles";

export interface UTextProps
  extends Omit<TextProps, "fontFamily" | "fontSize" | "fontWeight" | "letterSpacing"> {
  variant?: TextVariant;
}

export type { TamaguiTextElement };

const UText = forwardRef<TamaguiTextElement, UTextProps>((props, ref) => {
  const { children, variant = "body-md", ...restProps } = props;
  const variantStyle = useMemo(() => getVariantStyle(variant), [variant]);

  return (
    <Text ref={ref} {...variantStyle} {...restProps}>
      {children}
    </Text>
  );
});

UText.displayName = "UText";

export default UText;
