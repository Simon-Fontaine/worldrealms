import color from "color";

export function colorNameOrHexToRGB(
  colorString: string,
): [number, number, number] {
  const colorInstance = color(colorString);

  const rgbArray = colorInstance.rgb();

  return [rgbArray.red(), rgbArray.green(), rgbArray.blue()];
}
