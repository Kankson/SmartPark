export interface PlateRecognitionResult {
  plateNumber: string;
  confidence: number;
  provider: string;
}

export interface PlateRecognitionProvider {
  recognize(input: File | Buffer): Promise<PlateRecognitionResult>;
}

export class MockPlateRecognitionProvider implements PlateRecognitionProvider {
  async recognize(input: File | Buffer): Promise<PlateRecognitionResult> {
    void input;

    return {
      plateNumber: "GT 8841-21",
      confidence: 0.87,
      provider: "mock"
    };
  }
}
