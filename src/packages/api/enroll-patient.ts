import { z } from "zod";

const EnrollPatientSchema = z.object({
  lastname: z.string().min(1, "Last name is required"),
  firstname: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  birthdate: z.string().min(1, "Birthdate is required"),
  birthplace: z.string().min(1, "Birthplace is required"),
  gender: z.enum(["male", "female", "other"]),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]),
  addressNumber: z.string(),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressRegion: z.string(),
  addressZipcode: z.string(),
  USER_CONTACTNO: z.string().min(1, "Contact number is required"),
});

export default EnrollPatientSchema;