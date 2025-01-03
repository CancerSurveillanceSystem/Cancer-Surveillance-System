"use client";

import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { PatientsResponseSchema } from "@/packages/api/patient-list";
import checkupScheduleSchema from "@/packages/api/patient-scheduler";
import { z } from "zod";

type CheckupSchedule = z.infer<typeof checkupScheduleSchema>;
type PatientsResponse = z.infer<typeof PatientsResponseSchema>;
type Schedule = {
  checkupRequestDate: string;
};
type SubmittedWorkup = z.infer<typeof SubmittedWorkupSchema>;

// Define the schema for the API response
const SubmittedWorkupSchema = z.array(
  z.object({
    DIAGNOSIS: z.string(),
    LABORATORY: z.string(),
    ENCOUNTER_DATE: z.string(),
    SUBMISSION_DATE: z.string(),
    NAME: z.object({
      FIRSTNAME: z.string(),
      MIDDLENAME: z.string(),
      LASTNAME: z.string(),
    }),
  })
);
export const Dashboard = () => {
  const [patients, setPatients] = useState<PatientsResponse>([]);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState({ doctorId: "" });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [patientsScheduled, setPatientsScheduled] = useState<CheckupSchedule[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [todayPatients, setTodayPatients] = useState<CheckupSchedule[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  // Fetch logged-in user's doctor info
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      setDoctorInfo({ doctorId: parsedUserData.doctorId });
    }
  }, []);

  // Fetch all patients for the logged-in doctor
  const fetchPatients = async (doctorId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}css/onboard/getPatientsByDoctor/${doctorId}`
      );
      if (response.ok) {
        const data = await response.json();
        const validData = PatientsResponseSchema.parse(data);
        setPatients(validData);
      } else {
        console.error("Failed to fetch patients");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorInfo.doctorId) {
      fetchPatients(doctorInfo.doctorId);
    }
  }, [doctorInfo]);

  // Fetch patients scheduled for the selected date
  const fetchPatientsByDate = async (doctorId: string, selectedDate: string) => {
    setLoadingScheduled(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}css/checkup/schedule/fetchbydoctoranddate?doctorID=${doctorId}&date=${selectedDate}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const parsedData = checkupScheduleSchema.array().parse(data);
      setPatientsScheduled(parsedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError("Invalid data structure received from the API.");
        console.error("Zod validation error:", error.errors);
      } else {
        setError("Failed to fetch patient data.");
        console.error(error);
      }
    } finally {
      setLoadingScheduled(false);
    }
  };

  // Fetch patients scheduled for today
  const fetchTodayPatients = async (doctorId: string) => {
    setLoadingToday(true);
    setTodayError(null);

    try {
      let today;
      if (date) {
        today = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0].toString();
      } // Get today's date in ISO format (YYYY-MM-DD)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}css/checkup/schedule/fetchbydoctoranddate?doctorID=${doctorId}&date=${today}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const parsedData = checkupScheduleSchema.array().parse(data);
      setTodayPatients(parsedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setTodayError("Invalid data structure received from the API.");
        console.error("Zod validation error:", error.errors);
      } else {
        setTodayError("Failed to fetch patient data.");
        console.error(error);
      }
    } finally {
      setLoadingToday(false);
    }
  };

  // Fetch patients whenever date or doctor info changes
  useEffect(() => {
    if (doctorInfo.doctorId && date) {
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      fetchPatientsByDate(doctorInfo.doctorId, localDate);
    }
  }, [doctorInfo, date]);

  // Fetch today's patients when doctor info is available
  useEffect(() => {
    if (doctorInfo.doctorId) {
      fetchTodayPatients(doctorInfo.doctorId);
    }
  }, [doctorInfo]);

  const [scheduledDates, setScheduledDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}css/checkup/schedule/fetchbydoctor?doctorID=${doctorInfo.doctorId}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const schedules: Schedule[] = await response.json();
        console.log(schedules)
        const formattedDates = schedules.map((schedule) =>
          new Date(schedule.checkupRequestDate).toISOString().split("T")[0]
        );

        setScheduledDates(new Set(formattedDates));
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      }
    };

    fetchSchedule();
  }, [doctorInfo]);

  const isScheduled = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return scheduledDates.has(dateString);
  };

  const [workups, setWorkups] = useState<SubmittedWorkup>([]);
  const [, setLoadingWorkups] = useState(true);
  const [, setErrorWorkups] = useState<string | null>(null);

  // Fetch the submitted workups
  const fetchSubmittedWorkups = async () => {
    setLoadingWorkups(true);
    setErrorWorkups(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/lab/submit/all`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const parsedData = SubmittedWorkupSchema.parse(data);
      setWorkups(parsedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrorWorkups("Invalid data structure received from the API.");
        console.error("Zod validation error:", err.errors);
      } else {
        setErrorWorkups("Failed to fetch submitted workups.");
        console.error(err);
      }
    } finally {
      setLoadingWorkups(false);
    }
  };

  useEffect(() => {
    fetchSubmittedWorkups();
  }, []);

  // schedule a consult
  const [scheduleConsultFormData, setScheduleConsultFormData] = useState({
    patient_id: "",
    doctor_id: "",
    checkup_request_date: "",
    checkup_confirmed_date: "",
    checkup_start_time: "",
    checkup_end_time: "",
    checkup_status_id: 1,
  });

  const handleScheduleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setScheduleConsultFormData({ ...scheduleConsultFormData, [e.target.name]: e.target.value });
  };

  const handleSubmitSchedule = (patientId: number) => async (e: React.FormEvent) => {

    e.preventDefault();

    try {
      console.log(JSON.stringify(scheduleConsultFormData))
      const requestBody = {
        patient_id: patientId,
        doctor_id: doctorInfo.doctorId,
        checkup_request_date: scheduleConsultFormData.checkup_request_date,
        checkup_confirmed_date: scheduleConsultFormData.checkup_request_date,
        checkup_start_time: scheduleConsultFormData.checkup_start_time,
        checkup_end_time: scheduleConsultFormData.checkup_end_time,
        checkup_status_id: scheduleConsultFormData.checkup_status_id,
      }
      console.log(JSON.stringify(requestBody))
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/checkup/schedule/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule checkup");
      }

      alert("Checkup scheduled successfully!");
      setScheduleConsultFormData({
        patient_id: "",
        doctor_id: requestBody.doctor_id,
        checkup_request_date: "",
        checkup_confirmed_date: "",
        checkup_start_time: "",
        checkup_end_time: "",
        checkup_status_id: 1,
      });
    } catch (error) {
      console.error(error);
      alert("An error occurred while scheduling the checkup.");
    }
  };

  const [hoverRow, setHoverRow] = useState<number | null>(null);


  return (
    <div className="flex flex-col justify-start items-center h-screen">
      <div className="p-16 flex justify-center">
        <Label className="text-center text-6xl font-extrabold tracking-wide text-red-900 drop-shadow-md">
          Cancer Surveillance System
        </Label>
      </div>

      <div className="w-4/6 flex gap-16">
        <div className="w-1/2 p-2 rounded-lg bg-red-50 min-h-96">
          <div className="h-full">
            <div className="flex justify-center">
              <h2 className="text-black font-bold tracking-wide text-xl py-1">Patient List</h2>
            </div>
            <Tabs defaultValue="today" className="w-full h-full">
              <TabsList className="w-full bg-red-100 shadow-md">
                <TabsTrigger value="today" className="w-1/3 data-[state=active]:text-white">Today</TabsTrigger>
                <TabsTrigger value="selected" className="w-1/3 data-[state=active]:text-white">Select</TabsTrigger>
                <TabsTrigger value="allpatient" className="w-1/3 data-[state=active]:text-white">All</TabsTrigger>
              </TabsList>

              {/** Today Tab */}
              <TabsContent value="today" className="text-black h-full">
                <div className="max-h-72 overflow-y-auto">
                  <Table className="w-full">
                    <TableBody>
                      {loadingToday ? (
                        <TableRow>
                          <TableCell className="text-center text-black">Loading...</TableCell>
                        </TableRow>
                      ) : todayError ? (
                        <TableRow>
                          <TableCell className="text-center text-red-500">{todayError}</TableCell>
                        </TableRow>
                      ) : todayPatients.length > 0 ? (
                        todayPatients.map((relation) => (
                          <div
                            key={relation.patient.patientId}
                            className={`relative h-12 transition-all duration-300 w-full ${hoverRow === relation.patient.patientId ? "" : "w-1/2 mx-auto"}`}
                            onMouseEnter={() => setHoverRow(relation.patient.patientId)}
                            onMouseLeave={() => setHoverRow(null)}
                          >
                            <TableRow
                              className={`flex items-center justify-center border-0 ${hoverRow === relation.patient.patientId ? "w-1/2" : ""}`}
                            >
                              <TableCell className="text-center text-black">
                                {relation.patient.user.userFirstname} {relation.patient.user.userLastname}
                              </TableCell>
                            </TableRow>
                            {hoverRow === relation.patient.patientId && (
                              <Dialog>
                                <DialogTrigger>
                                  <div
                                    className="absolute top-1/2 right-0 transform -translate-y-5 p-1 px-2 bg-red-900 text-white shadow-lg rounded-md transition-opacity duration-300 hover:cursor-pointer"
                                    onClick={() => console.log(relation.patient.patientId)}
                                  >
                                    Schedule an Appointment
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="bg-white w-full max-w-3xl">
                                  <div className="mx-auto p-6 bg-white w-full">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Schedule Checkup</h2>
                                    <form onSubmit={handleSubmitSchedule(relation.patient.patientId)} className="space-y-4">
                                      <div className="flex flex-col w-full">
                                        <label
                                          htmlFor="checkup_request_date"
                                          className="text-sm font-semibold text-gray-700"
                                        >
                                          Request Date
                                        </label>
                                        <input
                                          type="date"
                                          id="checkup_request_date"
                                          name="checkup_request_date"
                                          value={scheduleConsultFormData.checkup_request_date}
                                          onChange={handleScheduleChange}
                                          className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                          required
                                        />
                                      </div>

                                      <div className="flex w-full gap-4">
                                        <div className="flex flex-col w-1/2">
                                          <label
                                            htmlFor="checkup_start_time"
                                            className="text-sm font-semibold text-gray-700"
                                          >
                                            Start Time
                                          </label>
                                          <input
                                            type="datetime-local"
                                            id="checkup_start_time"
                                            name="checkup_start_time"
                                            value={scheduleConsultFormData.checkup_start_time.replace(" ", "T")}
                                            onChange={(e) => {
                                              const formattedValue = e.target.value.replace("T", " ") + ":00";
                                              setScheduleConsultFormData((prevState) => ({
                                                ...prevState,
                                                checkup_start_time: formattedValue,
                                              }));
                                            }}
                                            className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                            required
                                          />
                                        </div>

                                        <div className="flex flex-col w-1/2">
                                          <label
                                            htmlFor="checkup_end_time"
                                            className="text-sm font-semibold text-gray-700"
                                          >
                                            End Time
                                          </label>
                                          <input
                                            type="datetime-local"
                                            id="checkup_end_time"
                                            name="checkup_end_time"
                                            value={scheduleConsultFormData.checkup_end_time.replace(" ", "T")}
                                            onChange={(e) => {
                                              const formattedValue = e.target.value.replace("T", " ") + ":00";
                                              setScheduleConsultFormData((prevState) => ({
                                                ...prevState,
                                                checkup_end_time: formattedValue,
                                              }));
                                            }}
                                            className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                            required
                                          />
                                        </div>
                                      </div>

                                      <div className="flex flex-col w-full">
                                        <label
                                          htmlFor="checkup_status_id"
                                          className="text-sm font-semibold text-gray-700"
                                        >
                                          Status
                                        </label>
                                        <select
                                          id="checkup_status_id"
                                          name="checkup_status_id"
                                          value={scheduleConsultFormData.checkup_status_id}
                                          onChange={handleScheduleChange}
                                          className={`mt-1 p-2 border rounded-lg shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 hover:shadow-md transition-all duration-200 `}
                                          required
                                        >
                                          <option value="" disabled>
                                            Select status
                                          </option>
                                          <option value="1">Request</option>
                                          <option value="2">Confirmed</option>
                                          <option value="3">Done</option>
                                          <option value="4">Cancelled</option>
                                        </select>

                                      </div>

                                      <button
                                        type="submit"
                                        className="w-full bg-red-900 text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
                                      >
                                        Schedule Checkup
                                      </button>
                                    </form>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="text-center text-black">No patients found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/** Selected Tab */}
              <TabsContent value="selected" className="text-black">
                <div className="max-h-72 overflow-y-auto">
                  <Table className="w-full">
                    <TableBody>
                      {loadingScheduled ? (
                        <TableRow>
                          <TableCell className="text-center text-black">Loading...</TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell className="text-center text-red-500">{error}</TableCell>
                        </TableRow>
                      ) : patientsScheduled.length > 0 ? (
                        patientsScheduled.map((relation) => (
                          <div
                            key={relation.patient.patientId}
                            className={`relative h-12 transition-all duration-300 w-full ${hoverRow === relation.patient.patientId ? "" : "w-1/2 mx-auto"}`}
                            onMouseEnter={() => setHoverRow(relation.patient.patientId)}
                            onMouseLeave={() => setHoverRow(null)}
                          >
                            <TableRow
                              className={`flex items-center justify-center border-0 ${hoverRow === relation.patient.patientId ? "w-1/2" : ""}`}
                            >
                              <TableCell className="text-center text-black">
                                {relation.patient.user.userFirstname} {relation.patient.user.userLastname}
                              </TableCell>
                            </TableRow>
                            {hoverRow === relation.patient.patientId && (
                              <Dialog>
                                <DialogTrigger>
                                  <div
                                    className="absolute top-1/2 right-0 transform -translate-y-5 p-1 px-2 bg-red-900 text-white shadow-lg rounded-md transition-opacity duration-300 hover:cursor-pointer"
                                    onClick={() => console.log(relation.patient.patientId)}
                                  >
                                    Schedule an Appointment
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="bg-white w-full max-w-3xl">
                                  <div className="mx-auto p-6 bg-white w-full">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Schedule Checkup</h2>
                                    <form onSubmit={handleSubmitSchedule(relation.patient.patientId)} className="space-y-4">
                                      <div className="flex flex-col w-full">
                                        <label
                                          htmlFor="checkup_request_date"
                                          className="text-sm font-semibold text-gray-700"
                                        >
                                          Request Date
                                        </label>
                                        <input
                                          type="date"
                                          id="checkup_request_date"
                                          name="checkup_request_date"
                                          value={scheduleConsultFormData.checkup_request_date}
                                          onChange={handleScheduleChange}
                                          className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                          required
                                        />
                                      </div>

                                      <div className="flex w-full gap-4">
                                        <div className="flex flex-col w-1/2">
                                          <label
                                            htmlFor="checkup_start_time"
                                            className="text-sm font-semibold text-gray-700"
                                          >
                                            Start Time
                                          </label>
                                          <input
                                            type="datetime-local"
                                            id="checkup_start_time"
                                            name="checkup_start_time"
                                            value={scheduleConsultFormData.checkup_start_time.replace(" ", "T")}
                                            onChange={(e) => {
                                              const formattedValue = e.target.value.replace("T", " ") + ":00";
                                              setScheduleConsultFormData((prevState) => ({
                                                ...prevState,
                                                checkup_start_time: formattedValue,
                                              }));
                                            }}
                                            className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                            required
                                          />
                                        </div>

                                        <div className="flex flex-col w-1/2">
                                          <label
                                            htmlFor="checkup_end_time"
                                            className="text-sm font-semibold text-gray-700"
                                          >
                                            End Time
                                          </label>
                                          <input
                                            type="datetime-local"
                                            id="checkup_end_time"
                                            name="checkup_end_time"
                                            value={scheduleConsultFormData.checkup_end_time.replace(" ", "T")}
                                            onChange={(e) => {
                                              const formattedValue = e.target.value.replace("T", " ") + ":00";
                                              setScheduleConsultFormData((prevState) => ({
                                                ...prevState,
                                                checkup_end_time: formattedValue,
                                              }));
                                            }}
                                            className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                            required
                                          />
                                        </div>
                                      </div>

                                      <div className="flex flex-col w-full">
                                        <label
                                          htmlFor="checkup_status_id"
                                          className="text-sm font-semibold text-gray-700"
                                        >
                                          Status
                                        </label>
                                        <select
                                          id="checkup_status_id"
                                          name="checkup_status_id"
                                          value={scheduleConsultFormData.checkup_status_id}
                                          onChange={handleScheduleChange}
                                          className={`mt-1 p-2 border rounded-lg shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 hover:shadow-md transition-all duration-200 `}
                                          required
                                        >
                                          <option value="" disabled>
                                            Select status
                                          </option>
                                          <option value="1">Request</option>
                                          <option value="2">Confirmed</option>
                                          <option value="3">Done</option>
                                          <option value="4">Cancelled</option>
                                        </select>

                                      </div>

                                      <button
                                        type="submit"
                                        className="w-full bg-red-900 text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
                                      >
                                        Schedule Checkup
                                      </button>
                                    </form>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="text-center text-black">No patients found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/** All Patients Tab */}
              <TabsContent value="allpatient" className="text-black h-full">
                <div className="max-h-72 overflow-y-auto">
                  <Table className="w-full">
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell className="text-center text-black">Loading...</TableCell>
                        </TableRow>
                      ) : patients.length > 0 ? (
                        patients.map((relation) => (
                          <div
                            key={relation.patient.patientId}
                            className={`relative h-12 transition-all duration-300 w-full ${hoverRow === relation.patient.patientId ? "" : "w-1/2 mx-auto"
                              }`}
                            onMouseEnter={() => setHoverRow(relation.patient.patientId)}
                            onMouseLeave={() => setHoverRow(null)}
                          >
                            <TableRow
                              className={`flex items-center justify-center border-0 transition-all ease-in-out duration-300 ${hoverRow === relation.patient.patientId ? "w-1/2" : ""
                                }`}
                            >
                              <TableCell className="text-center text-black">
                                {relation.patient.user.userFirstname} {relation.patient.user.userLastname}
                              </TableCell>
                            </TableRow>
                            {hoverRow === relation.patient.patientId && (
                              <Dialog>
                                <DialogTrigger>
                                  <div
                                    className="absolute top-1/2 right-0 transform -translate-y-5 p-1 px-2 bg-red-900 text-white shadow-lg rounded-md transition-all ease-in-out duration-300 hover:cursor-pointer"
                                    onClick={() => console.log(relation.patient.patientId)}
                                  >
                                    Schedule an Appointment
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="bg-white w-full max-w-3xl">
                                  <div className="mx-auto p-6 bg-white w-full">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Schedule Checkup</h2>
                                    <form onSubmit={handleSubmitSchedule(relation.patient.patientId)} className="space-y-4">
                                      <div className="flex flex-col w-full">
                                        <label
                                          htmlFor="checkup_request_date"
                                          className="text-sm font-semibold text-gray-700"
                                        >
                                          Request Date
                                        </label>
                                        <input
                                          type="date"
                                          id="checkup_request_date"
                                          name="checkup_request_date"
                                          value={scheduleConsultFormData.checkup_request_date}
                                          onChange={handleScheduleChange}
                                          className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                          required
                                        />
                                      </div>

                                      <div className="flex w-full gap-4">
                                        <div className="flex flex-col w-1/2">
                                          <label
                                            htmlFor="checkup_start_time"
                                            className="text-sm font-semibold text-gray-700"
                                          >
                                            Start Time
                                          </label>
                                          <input
                                            type="datetime-local"
                                            id="checkup_start_time"
                                            name="checkup_start_time"
                                            value={scheduleConsultFormData.checkup_start_time.replace(" ", "T")}
                                            onChange={(e) => {
                                              const formattedValue = e.target.value.replace("T", " ") + ":00";
                                              setScheduleConsultFormData((prevState) => ({
                                                ...prevState,
                                                checkup_start_time: formattedValue,
                                              }));
                                            }}
                                            className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                            required
                                          />
                                        </div>

                                        <div className="flex flex-col w-1/2">
                                          <label
                                            htmlFor="checkup_end_time"
                                            className="text-sm font-semibold text-gray-700"
                                          >
                                            End Time
                                          </label>
                                          <input
                                            type="datetime-local"
                                            id="checkup_end_time"
                                            name="checkup_end_time"
                                            value={scheduleConsultFormData.checkup_end_time.replace(" ", "T")}
                                            onChange={(e) => {
                                              const formattedValue = e.target.value.replace("T", " ") + ":00";
                                              setScheduleConsultFormData((prevState) => ({
                                                ...prevState,
                                                checkup_end_time: formattedValue,
                                              }));
                                            }}
                                            className={`mt-1 p-2 border rounded focus:outline-none focus:border-red-500 text-black`}
                                            required
                                          />
                                        </div>
                                      </div>

                                      <div className="flex flex-col w-full">
                                        <label
                                          htmlFor="checkup_status_id"
                                          className="text-sm font-semibold text-gray-700"
                                        >
                                          Status
                                        </label>
                                        <select
                                          id="checkup_status_id"
                                          name="checkup_status_id"
                                          value={scheduleConsultFormData.checkup_status_id}
                                          onChange={handleScheduleChange}
                                          className={`mt-1 p-2 border rounded-lg shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 hover:shadow-md transition-all duration-200 `}
                                          required
                                        >
                                          <option value="" disabled>
                                            Select status
                                          </option>
                                          <option value="1">Request</option>
                                          <option value="2">Confirmed</option>
                                          <option value="3">Done</option>
                                          <option value="4">Cancelled</option>
                                        </select>

                                      </div>

                                      <button
                                        type="submit"
                                        className="w-full bg-red-900 text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
                                      >
                                        Schedule Checkup
                                      </button>
                                    </form>
                                  </div>
                                </DialogContent>
                              </Dialog>

                            )}
                          </div>

                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="text-center text-black">No patients found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>;

          </div>
        </div>
        <div className="w-1/2">
          <Calendar
            className="h-full w-full flex text-black bg-red-50 rounded-xl"
            classNames={{
              months:
                "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
              month: "space-y-4 w-full flex flex-col",
              table: "w-full h-full border-collapse space-y-1",
              head_row: "",
              row: "w-full mt-2",
              head_cell: "rounded-none",
              day_today: "bg-red-200",
            }}
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{
              scheduled: (day) => isScheduled(day),
            }}
            modifiersClassNames={{
              scheduled: "scheduled-day",
            }}
          />
        </div>
      </div>


      <div className="py-10 w-4/6 flex flex-col space-y-6">
        <Label className="text-gray-800 font-extrabold text-2xl">
          Submitted Workup
        </Label>
        <div className="max-h-48 overflow-y-auto">
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow className="bg-red-100">
                <TableHead className="text-center text-gray-700 font-semibold text-lg py-2">
                  Name
                </TableHead>
                <TableHead className="text-center text-gray-700 font-semibold text-lg py-2">
                  Diagnosis
                </TableHead>
                <TableHead className="text-center text-gray-700 font-semibold text-lg py-2">
                  Submission Date
                </TableHead>
                <TableHead className="text-center text-gray-700 font-semibold text-lg py-2">
                  Laboratory
                </TableHead>
                <TableHead className="text-center text-gray-700 font-semibold text-lg py-2">
                  Last Encounter Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="text-center text-gray-500 italic py-4" colSpan={5}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell className="text-center text-red-600 py-4 font-medium" colSpan={5}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : workups.length > 0 ? (
                workups.map((workup, index) => (
                  <TableRow
                    key={index}
                    className={`hover:bg-red-200 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } transition-colors`}
                  >
                    <TableCell className="text-center text-gray-800 py-3">
                      {`${workup.NAME.FIRSTNAME} ${workup.NAME.MIDDLENAME} ${workup.NAME.LASTNAME}`}
                    </TableCell>
                    <TableCell className="text-center text-gray-800 py-3">
                      {workup.DIAGNOSIS}
                    </TableCell>
                    <TableCell className="text-center text-gray-800 py-3">
                      {new Date(workup.SUBMISSION_DATE).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center text-gray-800 py-3">
                      {workup.LABORATORY}
                    </TableCell>
                    <TableCell className="text-center text-gray-800 py-3">
                      {new Date(workup.ENCOUNTER_DATE).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-center text-gray-600 italic py-4" colSpan={5}>
                    No workups found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <style>
          {`
      /* Custom scrollbar */
      .max-h-56::-webkit-scrollbar {
        width: 8px;
      }
      .max-h-56::-webkit-scrollbar-thumb {
        background-color: #991b1b;
        border-radius: 4px;
      }
      .max-h-56::-webkit-scrollbar-thumb:hover {
        background-color: #7f1d1d;
      }
    `}
        </style>
      </div>

    </div>
  );
};
