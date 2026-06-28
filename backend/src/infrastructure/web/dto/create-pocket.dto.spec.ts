import { validate } from "class-validator";
import { CreatePocketDto } from "./create-pocket.dto";

describe("CreatePocketDto", () => {
  function makeDto(overrides: Partial<CreatePocketDto> = {}): CreatePocketDto {
    const dto = new CreatePocketDto();
    dto.name = "Test Pocket";
    dto.type = "goal";
    dto.goal = 1000;
    dto.accumulatedAmount = 500;
    dto.motivation = "Save for a trip";
    return Object.assign(dto, overrides);
  }

  it("should pass with valid required fields", async () => {
    const dto = makeDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe("sourceType", () => {
    it("should pass with 'external'", async () => {
      const dto = makeDto({ sourceType: "external" });
      const errors = await validate(dto);
      const srcErr = errors.find((e) => e.property === "sourceType");
      expect(srcErr).toBeUndefined();
    });

    it("should pass with 'transfer'", async () => {
      const dto = makeDto({ sourceType: "transfer" });
      const errors = await validate(dto);
      const srcErr = errors.find((e) => e.property === "sourceType");
      expect(srcErr).toBeUndefined();
    });

    it("should fail with invalid sourceType", async () => {
      const dto = makeDto({ sourceType: "invalid" as any });
      const errors = await validate(dto);
      const srcErr = errors.find((e) => e.property === "sourceType");
      expect(srcErr).toBeDefined();
    });

    it("should be optional (undefined is valid)", async () => {
      const dto = makeDto({ sourceType: undefined });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("sourcePocketId", () => {
    it("should pass with a valid string", async () => {
      const dto = makeDto({ sourcePocketId: "some-pocket-id" });
      const errors = await validate(dto);
      const srcErr = errors.find((e) => e.property === "sourcePocketId");
      expect(srcErr).toBeUndefined();
    });

    it("should be optional (undefined is valid)", async () => {
      const dto = makeDto({ sourcePocketId: undefined });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
