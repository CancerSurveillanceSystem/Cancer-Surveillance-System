"use client";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PatientSchema } from "@/packages/api/patient";
import { PatientsResponseSchema } from "@/packages/api/patient-list";
import React, { useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@/components/ui/dialog"
import { jsPDF } from "jspdf";
import { Edit, Trash2Icon } from "lucide-react";
import { z } from "zod";

interface ConsultFormData {
	PATIENT_ID: number;
	CONSULT_SUBJECTIVE: string;
	CONSULT_OBJECTIVE: string;
	CONSULT_ASSESSMENT: string;
	CONSULT_SURVWORKUP: string;
	CONSULT_RXPLAN: string;
	CONSULT_PATIENTSTATUS: number;
	CONSULT_DATE: string;
}

interface ValidationErrors {
	PATIENT_ID?: string;
	CONSULT_SUBJECTIVE?: string;
	CONSULT_OBJECTIVE?: string;
	CONSULT_ASSESSMENT?: string;
	CONSULT_SURVWORKUP?: string;
	CONSULT_RXPLAN?: string;
	CONSULT_PATIENTSTATUS?: string;
}

interface FormData {
	patientId?: string;
	lastname?: string;
	email?: string;
}

interface FilteredPatient {
	patientId: number;
	userFirstname: string;
	userLastname: string;
	userEmail: string;
}

interface Diagnosis {
	DATE: string | null;
	LATERALITY: string | null;
	STAGE: string | null;
}

interface HormonalTherapy {
	YN: string;
	COMPLIANCE: string | null;
}

interface Chemotherapy {
	YN: string;
	COMPLETION: string | null;
}

interface Name {
	MIDDLENAME: string;
	LASTNAME: string;
	FIRSTNAME: string;
}

interface Operation {
	SURGERY: string | null;
	DATE: string | null;
}

interface Radiotherapy {
	YN: string;
	COMPLETION: string | null;
}

interface PatientConsultInfo {
	DIAGNOSIS: Diagnosis;
	PATIENT_SISX_REPORT: string | null;
	PATIENT_REPORT_DATE: string | null;
	HORMONAL_THERAPY: HormonalTherapy;
	CHEMOTHERAPY: Chemotherapy;
	NAME: Name;
	STATUS: string;
	LATEST_LAB_SUBMITTED: string | null;
	OPERATION: Operation;
	LATEST_LAB_DATE: string | null;
	RADIOTHERAPY: Radiotherapy;
	LATEST_CONSULT_DATE: string | null;
	AGE: number;
}

interface DynamicPDFFormProps {
	title: string; // Form title (e.g., "Prescription Form", "Lab Request Form")
	label?: string; // Label for the input (e.g., "Prescription", "Workup Name")
	pdfTitle: string; // PDF header title (e.g., "Prescription", "Lab Request")
	fieldPlaceholder?: string; // Placeholder for the input
	filenamePrefix: string; // Prefix for the downloaded file
}

interface MedicalCertificatePDFProps {
	title: string;
	pdfTitle: string;
	filenamePrefix: string;
}

type PatientsResponse = z.infer<typeof PatientSchema>

interface EditData {
	USER_LASTNAME: string;
	USER_FIRSTNAME: string;
	USER_MIDDLENAME: string;
	USER_EMAIL: string;
	USER_GENDER: string;
	USER_MARITAL_STATUS: string;
	USER_BIRTHDATE: string;
	USER_BIRTHPLACE: string;
	ADDRESS_NUMBER: string;
	ADDRESS_STREET: string;
	ADDRESS_CITY: string;
	ADDRESS_REGION: string;
	ADDRESS_ZIPCODE: string;
	USER_CONTACTNO: string;
	USER_ENCODER: number;
}

type Drug = {
	drug: string;
	dose: string;
	days: number;
	preparation: string;
	items: number;
	price: number;
};

const ConsultPage = () => {
	const [formData, setFormData] = useState<ConsultFormData>({
		PATIENT_ID: 0,
		CONSULT_SUBJECTIVE: "",
		CONSULT_OBJECTIVE: "",
		CONSULT_ASSESSMENT: "",
		CONSULT_SURVWORKUP: "",
		CONSULT_RXPLAN: "",
		CONSULT_PATIENTSTATUS: 1,
		CONSULT_DATE: new Date()
			.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
	});

	const [patientConsultInfo, setPatientConsultInfo] = useState<PatientConsultInfo | null>(null);

	const [errors, setErrors] = useState<ValidationErrors>({});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: name === "PATIENT_ID" || name === "CONSULT_PATIENTSTATUS" ? Number(value) : value,
		}));
	};

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};

		if (!formData.PATIENT_ID) newErrors.PATIENT_ID = "Patient ID is required.";
		if (!formData.CONSULT_SUBJECTIVE)
			newErrors.CONSULT_SUBJECTIVE = "Subjective information is required.";
		if (!formData.CONSULT_OBJECTIVE)
			newErrors.CONSULT_OBJECTIVE = "Objective information is required.";
		if (!formData.CONSULT_ASSESSMENT)
			newErrors.CONSULT_ASSESSMENT = "Assessment is required.";
		if (!formData.CONSULT_SURVWORKUP)
			newErrors.CONSULT_SURVWORKUP = "Surveillance/Workup is required.";
		if (!formData.CONSULT_RXPLAN)
			newErrors.CONSULT_RXPLAN = "RX Plan is required.";
		if (!formData.CONSULT_PATIENTSTATUS)
			newErrors.CONSULT_PATIENTSTATUS = "Patient status is required.";
		console.log("THIS AN ERROR CURRIEEEEEEEe", newErrors);
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { toast } = useToast()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		const requestBody = {
			PATIENT_ID: Number(formData.PATIENT_ID),
			CONSULT_SUBJECTIVE: formData.CONSULT_SUBJECTIVE.trim(),
			CONSULT_OBJECTIVE: formData.CONSULT_OBJECTIVE.trim(),
			CONSULT_ASSESSMENT: formData.CONSULT_ASSESSMENT.trim(),
			CONSULT_SURVWORKUP: formData.CONSULT_SURVWORKUP.trim(),
			CONSULT_RXPLAN: formData.CONSULT_RXPLAN.trim(),
			CONSULT_PATIENTSTATUS: 3,
			CONSULT_DATE: formData.CONSULT_DATE,
		};

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/consult/add`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (response.ok) {
				toast({ title: "Consult added successfully!" });
				setFormData({
					PATIENT_ID: 0,
					CONSULT_SUBJECTIVE: "",
					CONSULT_OBJECTIVE: "",
					CONSULT_ASSESSMENT: "",
					CONSULT_SURVWORKUP: "",
					CONSULT_RXPLAN: "",
					CONSULT_PATIENTSTATUS: 1,
					CONSULT_DATE: new Date()
						.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
				});
				try {
					const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/patient/getConsultInfo/${Number(formData.PATIENT_ID)}`);
					if (response.ok) {
						const data = await response.json();
						setPatientConsultInfo(data);
					} else {
						console.error("Failed to fetch consultation details.");
						setPatientConsultInfo(null);
					}
				} catch (error) {
					console.error("Error fetching consultation details:", error);
					setPatientConsultInfo(null);
				}
				setErrors({});
			} else {
				alert("Failed to add consult.");
			}
		} catch (error) {
			console.error("Error:", error);
			alert("An error occurred. Please try again.");
		}
	};

	// for fetch patients
	const [searchFormData, setSearchFormData] = useState<FormData>({
		patientId: "",
		lastname: "",
		email: "",
	});
	const [patientSearchTerm, setPatientSearchTerm] = useState("");
	const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
	const [filteredPatients, setFilteredPatients] = useState<FilteredPatient[]>([]);
	const [allPatients, setAllPatients] = useState<FilteredPatient[]>([]); // Store all patients initially
	const [doctorInfo, setDoctorInfo] = useState("");
	const [doctorName, setDoctorName] = useState("");
	const [doctorHospital, setDoctorHospital] = useState("");

	const dropdownRefPatient = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			const parsedUserData = JSON.parse(userData);
			setDoctorName(parsedUserData.user.userFirstname + " " + parsedUserData.user.userLastname);
			setDoctorHospital(parsedUserData.hospital.hospitalName);
			setDoctorInfo(parsedUserData.doctorId);
		}
	}, []);

	const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const search = e.target.value.toLowerCase();
		setPatientSearchTerm(search);
		setPatientDropdownOpen(true);
		if (search === "") {
			setFilteredPatients(allPatients); // Show all patients if the search term is empty
		} else {
			const filtered = allPatients.filter((patient) =>
				patient.userLastname.toLowerCase().includes(search)
			);
			setFilteredPatients(filtered);
		}
	};

	const handleSelectPatient = async (patientId: number, firstname: string, lastname: string, email: string) => {
		setSearchFormData({ ...searchFormData, lastname: lastname, patientId: patientId.toString(), email: email });
		setFormData({ ...formData, PATIENT_ID: patientId })
		setPatientSearchTerm(`${firstname} ${lastname} (${email})`);
		setPatientDropdownOpen(false);
		// fetchPatient(patientId);

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/patient/getConsultInfo/${patientId}`);
			if (response.ok) {
				const data = await response.json();
				setPatientConsultInfo(data);
			} else {
				console.error("Failed to fetch consultation details.");
				setPatientConsultInfo(null);
			}
		} catch (error) {
			console.error("Error fetching consultation details:", error);
			setPatientConsultInfo(null);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRefPatient.current && !dropdownRefPatient.current.contains(event.target as Node)) {
				setPatientDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const fetchPatients = async () => {
			try {
				const userData = localStorage.getItem('user');
				if (userData) {
					const parsedUserData = JSON.parse(userData);
					const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/onboard/getPatientsByDoctor/${parsedUserData.doctorId}`);
					const data = await response.json();
					const parsedData = PatientsResponseSchema.parse(data);

					const patients = parsedData.map(relation => ({
						patientId: relation.patient.patientId,
						userFirstname: relation.patient.user.userFirstname,
						userLastname: relation.patient.user.userLastname,
						userEmail: relation.patient.user.userEmail,
					}));

					setAllPatients(patients); // Store all patients
					setFilteredPatients(patients); // Initially display all patients
				}
			} catch (error) {
				console.error("Error fetching patients:", error);
			}
		};

		fetchPatients();
	}, []);

	useEffect(() => {
		const fetchPatientDetails = async () => {
			try {
				const userData = localStorage.getItem('user');
				if (userData) {
					const parsedUserData = JSON.parse(userData);
					const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}css/patient/get/latest?doctorID=${parsedUserData.doctorId}`;

					const response = await fetch(apiUrl);
					if (!response.ok) {
						throw new Error(`Failed to fetch data: ${response.statusText}`);
					}

					const data = await response.json();

					const patientData = PatientSchema.parse(data);

					if (patientData) {
						setSearchFormData({
							...searchFormData,
							lastname: patientData.user.userLastname,
							patientId: patientData.patientId.toString(),
							email: patientData.user.userEmail,
						});

						// fetchPatient(patientData.patientId);

						setPatientSearchTerm(
							`${patientData.user.userFirstname} ${patientData.user.userLastname} (${patientData.user.userEmail})`
						);

						setFormData({ ...formData, PATIENT_ID: patientData.patientId });

						try {
							const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/patient/getConsultInfo/${patientData.patientId}`);
							if (response.ok) {
								const data = await response.json();
								setPatientConsultInfo(data);
							} else {
								console.error("Failed to fetch consultation details.");
								setPatientConsultInfo(null);
							}
						} catch (error) {
							console.error("Error fetching consultation details:", error);
							setPatientConsultInfo(null);
						}
					}
				}
			} catch (error) {
				console.error("Error fetching patients:", error);
			}
		};

		fetchPatientDetails();
	}, []);

	const DynamicPDFForm: React.FC<DynamicPDFFormProps> = ({
		title,
		label,
		pdfTitle,
		fieldPlaceholder = "",
		filenamePrefix,
	}) => {
		const [inputValue, setInputValue] = useState("");

		const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInputValue(e.target.value);
		};

		const generatePDF = () => {
			const patientName = patientConsultInfo?.NAME
				? `${patientConsultInfo.NAME.FIRSTNAME} ${patientConsultInfo.NAME.LASTNAME}`
				: "Unknown Patient";
			const patientAge = patientConsultInfo?.AGE || "N/A";

			const doc = new jsPDF();

			// Header
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(139, 0, 0); // Red-900
			doc.text(pdfTitle, 105, 20, { align: "center" });

			// Patient Information
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0); // Black
			doc.text(`Patient Name: ${patientName}`, 20, 40);
			doc.text(`Age: ${patientAge}`, 20, 50);

			// Separator
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 60, 190, 60);

			// Input Content
			doc.setFont("helvetica", "normal");
			doc.setFontSize(12);
			doc.text(`${label} Details:`, 20, 70);
			doc.setFontSize(11);
			doc.text(inputValue, 20, 80, { maxWidth: 170, lineHeightFactor: 1.5 });

			// Footer
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 260, 190, 260);
			doc.setFontSize(10);
			doc.setTextColor(100);
			doc.text("Generated using Cancer Surveillance System © 2024", 105, 270, {
				align: "center",
			});

			doc.save(`${filenamePrefix}_${patientName}.pdf`);
		};

		return (
			<div className="flex items-center justify-center">
				<div className="w-full max-w-md bg-white rounded-lg p-6">
					<h2 className="text-2xl font-bold text-red-900 text-center mb-4">
						{title}
					</h2>
					<form className="space-y-4">
						<div>
							<label className="block text-red-900 font-medium mb-2">{label}</label>
							<textarea
								value={inputValue}
								onChange={handleInputChange}
								rows={6}
								className="w-full border-red-300 rounded-md shadow-sm focus:border-red-900 focus:ring-red-900 p-4 text-black"
								placeholder={fieldPlaceholder}
							/>
						</div>
						<button
							type="button"
							onClick={generatePDF}
							disabled={!inputValue.trim()}
							className={`w-full py-2 px-4 text-white font-semibold rounded-md shadow ${inputValue.trim()
								? "bg-red-900 hover:bg-red-800"
								: "bg-red-300 cursor-not-allowed"
								}`}
						>
							Download PDF
						</button>
					</form>
				</div>
			</div>
		);
	};

	const DynamicPDFProgressReport: React.FC = () => {
		const [pastMedicalHistory, setPastMedicalHistory] = useState("");
		const [physicalExam, setPhysicalExam] = useState("");
		const [treatmentPlan, setTreatmentPlan] = useState("");
		const [bsa, setBsa] = useState("");
		const [drugs, setDrugs] = useState([
			{ drug: "", dose: "", days: "", preparation: "", items: "", price: "" },
		]);

		// New state variables for Progress Report
		const [cyclesGiven, setCyclesGiven] = useState("");
		const [lastCycleDate, setLastCycleDate] = useState("");
		const [adverseEvents, setAdverseEvents] = useState("");
		const [treatmentResponse, setTreatmentResponse] = useState("");
		const [remainingCycles, setRemainingCycles] = useState("");
		const [nextCycleDate, setNextCycleDate] = useState("");

		const diagnosis = patientConsultInfo?.DIAGNOSIS.LATERALITY; // Given as part of the report

		// Attending Physician Fields
		const [licenseNo, setLicenseNo] = useState("");
		const [ptrNo, setPtrNo] = useState("");
		const [s2No, setS2No] = useState("");

		const handleDrugChange = (index: number, field: string, value: string) => {
			const updatedDrugs = [...drugs];
			updatedDrugs[index] = { ...updatedDrugs[index], [field]: value };
			setDrugs(updatedDrugs);
		};

		const addDrugRow = () => {
			setDrugs([...drugs, { drug: "", dose: "", days: "", preparation: "", items: "", price: "" }]);
		};

		const generatePDF = () => {
			const patientName = patientConsultInfo?.NAME
				? `${patientConsultInfo.NAME.FIRSTNAME} ${patientConsultInfo.NAME.LASTNAME}`
				: "Unknown Patient";
			const patientAge = patientConsultInfo?.AGE || "N/A";

			const doc = new jsPDF();

			// Header
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(139, 0, 0); // Red-900
			doc.text("Clinical Abstract", 105, 20, { align: "center" });

			// Patient Information
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0); // Black
			doc.text(`Patient Name: ${patientName}`, 20, 40);
			doc.text(`Age: ${patientAge}`, 20, 50);

			// Separator
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 60, 190, 60);

			// Input Fields - Adjusted to start after the separator line
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0); // Black
			doc.setFont("helvetica", "bold");
			doc.text("Past Medical History: ", 20, 70); // Adjusted Y-position
			doc.setFont("helvetica", "normal");
			doc.text(`${pastMedicalHistory || "N/A"}`, doc.getTextWidth("Past Medical History: ") + 25, 70);

			doc.setFont("helvetica", "bold");
			doc.text(`Physical Examination:`, 20, 80); // Adjusted Y-position
			doc.setFont("helvetica", "normal");
			doc.text(physicalExam || "N/A", 20, 90, { maxWidth: 170, lineHeightFactor: 1.5 });

			doc.setFont("helvetica", "bold");
			doc.text("Diagnosis: ", 20, 110); // Adjusted Y-position
			doc.setFont("helvetica", "normal");
			doc.text(`${diagnosis}`, doc.getTextWidth("Diagnosis: ") + 25, 110);

			doc.setFont("helvetica", "bold");
			doc.text("Treatment Plan: ", 20, 120); // Adjusted Y-position
			doc.setFont("helvetica", "normal");
			doc.text(`${treatmentPlan || "N/A"}`, doc.getTextWidth("Treatment Plan: ") + 25, 120);

			// Progress Report - Adjusted Y-position
			doc.setFont("helvetica", "bold");
			doc.text("Progress Report:", 20, 140); // Adjusted Y-position
			doc.setFont("helvetica", "normal");
			doc.text(`Number of cycles/sessions already given: ${cyclesGiven || "N/A"}`, 20, 150);
			doc.text(`Date of last cycle/session: ${lastCycleDate || "N/A"}`, 20, 160);
			doc.text(`Adverse events noted: ${adverseEvents || "N/A"}`, 20, 170);
			doc.text(`Response to treatment: ${treatmentResponse || "N/A"}`, 20, 180);
			doc.text(`Number of remaining cycles/sessions: ${remainingCycles || "N/A"} cycles`, 20, 190);
			doc.text(`Date of next cycle session: ${nextCycleDate || "N/A"}`, 20, 200);

			// Footer
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 260, 190, 260);
			doc.setFontSize(10);
			doc.setTextColor(100);
			doc.text("Generated using Cancer Surveillance System © 2024", 105, 270, {
				align: "center",
			});

			doc.addPage(); // New page added here
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0); // Black

			// Header
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(139, 0, 0); // Red-900
			doc.text("Clinical Abstract", 105, 20, { align: "center" });

			// Patient Information
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0); // Black
			doc.text(`Patient Name: ${patientName}`, 20, 40);
			doc.text(`Age: ${patientAge}`, 20, 50);

			// Separator
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 60, 190, 60);

			// Adjust `currentY` to start after the separator line
			let currentY = 70; // Start below the line, which ends at Y = 60

			// Treatment Protocol
			doc.setFont("helvetica", "bold");
			doc.text("Treatment Protocol:", 20, currentY);
			doc.setFont("helvetica", "normal");
			doc.text(`BSA: ${bsa || "N/A"} m²`, 20, currentY + 10);

			// Adjust `currentY` after the Treatment Protocol section
			currentY += 20;

			// Drug Table
			const headers = ["Drug", "Dose", "Days", "Preparation", "Items", "Price/item", "Total Price"];
			const rowHeight = 10;
			const colWidths = [30, 15, 15, 40, 15, 25, 30];

			// Draw table header
			doc.setFont("helvetica", "bold");
			let currentX = 20;
			headers.forEach((header, index) => {
				doc.text(header, currentX + 2, currentY + 6);
				doc.rect(currentX, currentY, colWidths[index], rowHeight);
				currentX += colWidths[index];
			});
			currentY += rowHeight;

			// Draw table rows
			doc.setFont("helvetica", "normal");
			drugs.forEach((drug) => {
				currentX = 20;
				const itemCount = parseFloat(drug.items) || 0; // Convert items to a number, default to 0 if invalid
				const itemPrice = parseFloat(drug.price) || 0; // Convert price to a number, default to 0 if invalid
				const totalPrice = itemCount * itemPrice; // Multiply the two values

				const values = [
					drug.drug || "N/A",
					drug.dose || "N/A",
					drug.days || "N/A",
					drug.preparation || "N/A",
					drug.items || "N/A",
					drug.price || "N/A",
					totalPrice.toFixed(2) || "Auto", // Format the total price as a number with 2 decimal places
				];

				values.forEach((value, index) => {
					doc.text(value, currentX + 2, currentY + 6);
					doc.rect(currentX, currentY, colWidths[index], rowHeight);
					currentX += colWidths[index];
				});

				currentY += rowHeight;
			});

			// Total Cost
			doc.text(`Total Cost for ______ cycles: ____________________`, 20, currentY + 10);

			// Footer
			doc.setFont("helvetica", "bold");
			doc.text("Attending Physician:", 20, currentY + 30);
			currentY += 10; // Adjust Y position after the section title
			doc.setFont("helvetica", "normal");
			doc.text(`License No.: ${licenseNo || "N/A"}`, 20, currentY + 30);
			currentY += 10;
			doc.text(`PTR No.: ${ptrNo || "N/A"}`, 20, currentY + 30);
			currentY += 10;
			doc.text(`S2 No.: ${s2No || "N/A"}`, 20, currentY + 30);

			// Footer
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 260, 190, 260);
			doc.setFontSize(10);
			doc.setTextColor(100);
			doc.text("Generated using Cancer Surveillance System © 2024", 105, 270, {
				align: "center",
			});

			// Save PDF
			doc.save("Progress_Report_Treatment_Plan.pdf");
		};

		function removeDrugRow(index: number): void {
			setDrugs((prevDrugs) => prevDrugs.filter((_, i) => i !== index));
		}

		return (
			<div className="flex items-center justify-center h-full overflow-hidden">
				<div className="w-full max-w-3xl rounded-lg p-6 overflow-y-auto h-full">
					<h2 className="text-2xl font-bold text-red-900 text-center mb-4">
						Clinical Abstract
					</h2>
					<form className="space-y-6">
						{[
							{
								label: "Past Medical History",
								type: "text",
								value: pastMedicalHistory,
								onChange: setPastMedicalHistory,
							},
							{
								label: "Physical Examination",
								type: "textarea",
								value: physicalExam,
								onChange: setPhysicalExam,
								rows: 4,
							},
							{
								label: "Treatment Plan",
								type: "text",
								value: treatmentPlan,
								onChange: setTreatmentPlan,
							},
							{
								label: "Number of Cycles/Sessions Given",
								type: "text",
								value: cyclesGiven,
								onChange: setCyclesGiven,
							},
							{
								label: "Date of Last Cycle/Session",
								type: "date",
								value: lastCycleDate,
								onChange: setLastCycleDate,
							},
							{
								label: "Adverse Events Noted",
								type: "text",
								value: adverseEvents,
								onChange: setAdverseEvents,
							},
							{
								label: "Response to Treatment",
								type: "text",
								value: treatmentResponse,
								onChange: setTreatmentResponse,
							},
							{
								label: "Number of Remaining Cycles/Sessions",
								type: "text",
								value: remainingCycles,
								onChange: setRemainingCycles,
							},
							{
								label: "Date of Next Cycle Session",
								type: "date",
								value: nextCycleDate,
								onChange: setNextCycleDate,
							},
							{
								label: "BSA (m²)",
								type: "text",
								value: bsa,
								onChange: setBsa,
							},
						].map(({ label, type, value, onChange, rows }, idx) => (
							<div key={idx}>
								<label className="block text-red-900 font-semibold mb-2">{label}</label>
								{type === "textarea" ? (
									<textarea
										value={value}
										onChange={(e) => onChange(e.target.value)}
										rows={rows}
										className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-4 text-gray-700"
									/>
								) : (
									<input
										type={type}
										value={value}
										onChange={(e) => onChange(e.target.value)}
										className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-4 text-gray-700"
									/>
								)}
							</div>
						))}

						{/* Drugs Table */}
						<div>
							<label className="block text-red-900 font-semibold mb-4">Drugs</label>
							<div className="overflow-x-auto">
								<table className="min-w-full bg-white border border-gray-200">
									<thead>
										<tr className="bg-gray-100">
											{['Drug', 'Dose', 'Days', 'Preparation', 'Items', 'Price', ''].map((header, idx) => (
												<th key={idx} className="text-center py-3 px-4 border-b text-gray-700">{header}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{drugs.map((drug, index) => (
											<tr key={index} className="border-b">
												{['drug', 'dose', 'days', 'preparation', 'items', 'price'].map((field, colIndex) => (
													<td key={colIndex} className="p-2 border-r">
														<input
															type={field === 'items' || field === 'price' ? 'number' : 'text'}
															value={drug[field as keyof Drug]}
															onChange={(e) => handleDrugChange(index, field, e.target.value)}
															className="w-full rounded-lg p-2 focus:ring-2 focus:ring-red-700 focus:outline-none text-black"
														/>
													</td>
												))}
												<td className="py-2 px-4">
													<button
														type="button"
														onClick={() => removeDrugRow(index)}
														className="text-red-700 hover:text-red-900"
													>
														<Trash2Icon />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<button
								type="button"
								onClick={addDrugRow}
								className="mt-4 text-red-800 hover:text-red-900 font-medium text-sm"
							>
								+ Add Drug Row
							</button>
						</div>

						<label className="block text-red-900 font-semibold mb-2">Attending Physician</label>
						{[
							{ label: "License No.", value: licenseNo, onChange: setLicenseNo },
							{ label: "PTR No.", value: ptrNo, onChange: setPtrNo },
							{ label: "S2 No.", value: s2No, onChange: setS2No },
						].map(({ label, value, onChange }, idx) => (
							<div key={idx}>
								<label className="block text-red-900 font-semibold mb-2">{label}</label>
								<input
									type="text"
									value={value}
									onChange={(e) => onChange(e.target.value)}
									className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-4 text-gray-700"
								/>
							</div>
						))}

						<button
							type="submit"
							onClick={generatePDF}
							className="w-full py-3 px-6 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition"
						>
							Download PDF
						</button>
					</form>
				</div>
			</div>
		);

	};

	const MedicalCertificatePDF: React.FC<MedicalCertificatePDFProps> = ({
		title,
		pdfTitle,
		filenamePrefix,
	}) => {
		const [sex, setSex] = useState("");
		const [civilStatus, setCivilStatus] = useState("");
		const [address, setAddress] = useState("");
		const [medicalCondition, setMedicalCondition] = useState("");
		const [remarks, setRemarks] = useState("");
		const [licenseNo, setLicenseNo] = useState("");
		const [ptrNo, setPtrNo] = useState("");

		const generatePDF = () => {
			const patientName = patientConsultInfo?.NAME
				? `${patientConsultInfo.NAME.FIRSTNAME} ${patientConsultInfo.NAME.LASTNAME}`
				: "Unknown Patient";
			const patientAge = patientConsultInfo?.AGE || "N/A";

			const today = new Date();
			const dateString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

			const doc = new jsPDF();

			// Set title with a bold and larger font, centered alignment, and a soft red color
			doc.setFont("helvetica", "bold");
			doc.setFontSize(24);
			doc.setTextColor(139, 0, 0); // Soft red color
			doc.text(pdfTitle, 105, 30, { align: "center" });

			// Set general body font and size
			doc.setFont("helvetica", "normal");
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0);

			// Add date section with a soft grey text color
			doc.text("Date:", 20, 50);
			doc.text(dateString, 32, 50);

			// Introduction text with clear spacing
			doc.text("To whom it may concern:", 20, 60);
			doc.text(`This is to certify that ${patientName || "____________________"}`, 20, 70);
			doc.text(`Age: ${patientAge || "_______"}`, 20, 80);
			doc.text(`Sex: ${sex || "_______"}`, 80, 80);
			doc.text(`Civil Status: ${civilStatus || "____________________"}`, 120, 80);

			// Address and medical condition in clear sections
			doc.text(`Residing at ${address || "_______________________________"}`, 20, 90);
			doc.text("Has been under my medical care for the following medical condition:", 20, 100);
			doc.text(`${medicalCondition}`, 22, 110, { maxWidth: 170, lineHeightFactor: 1.5 });
			doc.rect(20, 103, 170, 20); // Draw a box around the medical condition section

			// Certification statement with subtle emphasis
			doc.text("This certification is being issued upon request to be used exclusively for medical purposes.", 20, 130, { maxWidth: 170 });

			// Remarks section with a light box around it
			doc.text("REMARKS:", 20, 160);
			doc.text(`${remarks}`, 22, 170);
			doc.rect(20, 163, 170, 20); // Draw a box around the medical condition section

			// Signature and doctor information at the bottom
			doc.text("(Signature over printed name)", 20, 210);
			doc.text("Attending Physician", 20, 220);

			// Add License No. and PTR No. in a structured manner with a box for clarity
			doc.text("License No.:", 20, 240);
			doc.text(licenseNo || "____________________", 60, 240);
			doc.text("PTR No.:", 20, 250);
			doc.text(ptrNo || "____________________", 60, 250);

			// Footer
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 280, 190, 280);
			doc.setFontSize(10);
			doc.setTextColor(100);
			doc.text("Generated using Cancer Surveillance System © 2024", 105, 290, {
				align: "center",
			});

			// Save the PDF with a dynamic file name based on patient name
			doc.save(`${filenamePrefix}_${patientName}.pdf`);
		};

		return (
			<div className="flex items-center justify-center h-full overflow-hidden">
				<div className="w-full max-w-3xl rounded-lg p-6 overflow-y-auto h-full">
					<h2 className="text-2xl font-bold text-red-900 text-center mb-6">
						{title}
					</h2>
					<form className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-red-900 font-bold">
									Sex
								</label>
								<input
									type="text"
									value={sex}
									onChange={(e) => setSex(e.target.value)}
									className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
								/>
							</div>

							<div>
								<label className="block text-red-900 font-bold">
									Civil Status
								</label>
								<input
									type="text"
									value={civilStatus}
									onChange={(e) => setCivilStatus(e.target.value)}
									className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
								/>
							</div>
						</div>

						<div>
							<label className="block text-red-900 font-bold">
								Address
							</label>
							<input
								type="text"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
							/>
						</div>

						<div>
							<label className="block text-red-900 font-bold">
								Medical Condition
							</label>
							<textarea
								value={medicalCondition}
								onChange={(e) => setMedicalCondition(e.target.value)}
								rows={4}
								className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
							/>
						</div>

						<div>
							<label className="block text-red-900 font-bold">
								Remarks
							</label>
							<textarea
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								rows={4}
								className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
							/>
						</div>

						<label className="block text-red-900 font-semibold mb-2">Attending Physician</label>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-red-900 font-bold">
									License No.
								</label>
								<input
									type="text"
									value={licenseNo}
									onChange={(e) => setLicenseNo(e.target.value)}
									className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
								/>
							</div>

							<div>
								<label className="block text-red-900 font-bold">
									PTR No.
								</label>
								<input
									type="text"
									value={ptrNo}
									onChange={(e) => setPtrNo(e.target.value)}
									className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none p-2 text-gray-700"
								/>
							</div>
						</div>

						<button
							type="button"
							onClick={generatePDF}
							disabled={!medicalCondition.trim()}
							className={`w-full py-2 px-4 text-white font-semibold rounded-md shadow ${medicalCondition.trim()
								? "bg-red-900 hover:bg-red-800"
								: "bg-red-300 cursor-not-allowed"}`}
						>
							Download PDF
						</button>
					</form>
				</div>
			</div>
		);
	};

	const ReferralPDFForm: React.FC<DynamicPDFFormProps> = ({
		title,
		pdfTitle,
		fieldPlaceholder,
		filenamePrefix,
	}) => {
		const [reason, setReason] = useState("");
		const [whereToRefer, setWhereToRefer] = useState("");

		const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setReason(e.target.value);
		};

		const handleWhereToReferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setWhereToRefer(e.target.value);
		};

		const generatePDF = () => {
			const patientName = patientConsultInfo?.NAME
				? `${patientConsultInfo.NAME.FIRSTNAME} ${patientConsultInfo.NAME.LASTNAME}`
				: "Unknown Patient";
			const patientAge = patientConsultInfo?.AGE || "N/A";

			const doc = new jsPDF();

			// Header
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(139, 0, 0); // Red-900
			doc.text(pdfTitle, 105, 20, { align: "center" });

			// Patient Information
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0); // Black
			doc.text(`Patient Name: ${patientName}`, 20, 40);
			doc.text(`Age: ${patientAge}`, 20, 50);

			// Doctor and Hospital Information
			doc.text(`Referred by: Dr. ${doctorName}`, 20, 60);
			doc.text(`Hospital: ${doctorHospital}`, 20, 70);

			// Separator
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 80, 190, 80);

			// Referral Details
			doc.setFont("helvetica", "normal");
			doc.setFontSize(12);
			doc.text("Reason for Referral:", 20, 90);
			doc.setFontSize(11);
			doc.text(reason, 20, 100, { maxWidth: 170, lineHeightFactor: 1.5 });

			if (whereToRefer.trim()) {
				doc.setFontSize(12);
				doc.text("Where to Refer:", 20, 130);
				doc.setFontSize(11);
				doc.text(whereToRefer, 20, 140, { maxWidth: 170, lineHeightFactor: 1.5 });
			}

			// Footer
			doc.setDrawColor(139, 0, 0); // Red-900
			doc.line(20, 260, 190, 260);
			doc.setFontSize(10);
			doc.setTextColor(100);
			doc.text("Generated using Cancer Surveillance System © 2024", 105, 270, {
				align: "center",
			});

			doc.save(`${filenamePrefix}_${patientName}.pdf`);
		};

		return (
			<div className="flex items-center justify-center">
				<div className="w-full max-w-md bg-white rounded-lg p-6">
					<h2 className="text-2xl font-bold text-red-900 text-center mb-4">
						{title}
					</h2>
					<form className="space-y-4">
						<div>
							<label className="block text-red-900 font-medium mb-2">
								Reason for Referral
							</label>
							<textarea
								value={reason}
								onChange={handleReasonChange}
								rows={4}
								className="w-full border-red-300 rounded-md shadow-sm focus:border-red-900 focus:ring-red-900 p-4 text-black"
								placeholder={fieldPlaceholder}
							/>
						</div>
						<div>
							<label className="block text-red-900 font-medium mb-2">
								Where to Refer (Optional)
							</label>
							<input
								type="text"
								value={whereToRefer}
								onChange={handleWhereToReferChange}
								className="w-full border-red-300 rounded-md shadow-sm focus:border-red-900 focus:ring-red-900 p-4 text-black"
								placeholder="Enter referral location (e.g., Specialist Clinic)"
							/>
						</div>
						<button
							type="button"
							onClick={generatePDF}
							disabled={!reason.trim()}
							className={`w-full py-2 px-4 text-white font-semibold rounded-md shadow ${reason.trim()
								? "bg-red-900 hover:bg-red-800"
								: "bg-red-300 cursor-not-allowed"
								}`}
						>
							Download PDF
						</button>
					</form>
				</div>
			</div>
		);
	};

	const [patient, setPatient] = useState<PatientsResponse | null>(null);
	const [editMode, setEditMode] = useState(false);

	const [editData, setEditData] = useState<EditData>({
		USER_LASTNAME: "",
		USER_FIRSTNAME: "",
		USER_MIDDLENAME: "",
		USER_EMAIL: "",
		USER_GENDER: "",
		USER_MARITAL_STATUS: "",
		USER_BIRTHDATE: "",
		USER_BIRTHPLACE: "",
		ADDRESS_NUMBER: "",
		ADDRESS_STREET: "",
		ADDRESS_CITY: "",
		ADDRESS_REGION: "",
		ADDRESS_ZIPCODE: "",
		USER_CONTACTNO: "",
		USER_ENCODER: 0,
	});
	const [, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPatient = async (patientId: string | undefined) => {
			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}css/patient/find?patientID=${patientId}`
				);
				if (!response.ok) {
					throw new Error('Failed to fetch patient data');
				}
				const data: PatientsResponse = await response.json();
				setPatient(data);
				setEditData(mapPatientToEditData(data));
			} catch (err) {
				setError((err as Error).message);
			}
		};

		if (searchFormData) {
			fetchPatient(searchFormData.patientId);
		}
	}, [searchFormData]);

	const mapPatientToEditData = (patient: PatientsResponse) => ({
		USER_LASTNAME: patient.user.userLastname,
		USER_FIRSTNAME: patient.user.userFirstname,
		USER_MIDDLENAME: patient.user.userMiddlename,
		USER_EMAIL: patient.user.userEmail,
		USER_GENDER: patient.user.userGender,
		USER_MARITAL_STATUS: patient.user.userMaritalStatus,
		USER_BIRTHDATE: patient.user.userBirthdate,
		USER_BIRTHPLACE: patient.user.userBirthplace,
		ADDRESS_NUMBER: patient.user.userAddress.addressNumber,
		ADDRESS_STREET: patient.user.userAddress.addressStreet,
		ADDRESS_CITY: patient.user.userAddress.addressCity,
		ADDRESS_REGION: patient.user.userAddress.addressRegion,
		ADDRESS_ZIPCODE: patient.user.userAddress.addressZipcode,
		USER_CONTACTNO: patient.user.userContactno,
		USER_ENCODER: Number(doctorInfo),
	});

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Format the birthdate before submitting
		const formattedEditData = {
			...editData,
			USER_BIRTHDATE: new Date(editData.USER_BIRTHDATE)
				.toLocaleDateString('en-GB') // Format as dd/MM/yyyy
				.split('/')
				.join('/'), // Ensure proper formatting
		};

		console.log(JSON.stringify(formattedEditData));

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}css/patient/update/${searchFormData.patientId}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(formattedEditData),
				}
			);
			if (!response.ok) {
				throw new Error('Failed to update patient data');
			}
			alert('Patient information updated successfully!');
			setEditMode(false);
		} catch (err) {
			alert((err as Error).message);
		}
	};


	return (
		<div className="w-5/6 bg-white flex flex-col items-center justify-center gap-4">
			<div className="w-6/12 h-auto mt-12 p-2 text-center">
				<p className="font-bold text-6xl text-red-900 text-nowrap	tracking-wide">CONSULT</p>
			</div>

			<div className="flex w-8/12 flex-col">
				<div className="flex flex-col w-full relative" ref={dropdownRefPatient}>
					<label htmlFor="lastname" className="text-sm font-semibold text-black">Search Patient</label>
					<input
						type="text"
						name="lastname"
						value={patientSearchTerm}
						onChange={handlePatientSearchChange}
						onClick={() => setPatientDropdownOpen(true)}
						className="mt-1 hover:border-red-200 p-2 border rounded focus:outline-none focus:border-red-500 text-black"
						placeholder="Select or search Last Name"
					/>
					{patientDropdownOpen && (
						<ul className="absolute z-10 top-16 bg-white border border-gray-300 w-full mt-1 hover:border-red-200 rounded shadow-lg max-h-40 overflow-y-auto">
							{filteredPatients.length > 0 ? (
								filteredPatients.map(patient => (
									<li
										key={patient.patientId}
										className="flex gap-2 p-2 text-black hover:bg-gray-200 cursor-pointer"
										onClick={() => handleSelectPatient(patient.patientId, patient.userFirstname, patient.userLastname, patient.userEmail)}
									>
										{patient.userFirstname} {patient.userLastname} <p className="text-zinc-400">({patient.userEmail})</p>
									</li>
								))
							) : (
								<li className="p-2 text-gray-500">No patients found</li>
							)}
						</ul>
					)}
				</div>
				<div className="flex flex-col w-full py-4">
					<div className="flex flex-col w-full gap-6 p-8 my-4 rounded-3xl shadow-lg border border-zinc-100">
						<div className="w-full">
							<div className="flex flex-col w-full gap-6">
								<div className="flex w-full gap-4">
									{/* Name */}
									<div className="w-8/12 flex flex-col">
										<label className="text-sm font-semibold text-gray-800">Name:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.NAME
												? `${patientConsultInfo.NAME.FIRSTNAME || ""} ${patientConsultInfo.NAME.MIDDLENAME || ""} ${patientConsultInfo.NAME.LASTNAME || ""}`.trim() || "Unknown Patient"
												: "Unknown Patient"}
										</span>
									</div>
									{/* Age */}
									<div className="flex flex-col w-4/12">
										<label className="text-sm font-semibold text-gray-800">Age:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.AGE || "N/A"}
										</span>
									</div>
								</div>

								<div className="flex w-full gap-4">
									{/* Diagnosis */}
									<div className="flex flex-col w-1/2">
										<label className="text-sm font-semibold text-gray-800">Diagnosis:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.DIAGNOSIS ? (
												!patientConsultInfo.DIAGNOSIS.STAGE && !patientConsultInfo.DIAGNOSIS.LATERALITY ? (
													"No diagnosis profile"
												) : (
													`Stage ${patientConsultInfo.DIAGNOSIS.STAGE || "N/A"} - ${{
														1: "Left Laterality",
														2: "Right Laterality",
														3: "Bilateral Laterality",
														4: "Mid Laterality",
														5: "Not Stated",
														6: "Not Applicable",
													}[patientConsultInfo.DIAGNOSIS.LATERALITY as keyof typeof patientConsultInfo.DIAGNOSIS.LATERALITY] || "N/A"
													}`
												)
											) : (
												"N/A"
											)}
										</span>
									</div>

									{/* Date of Diagnosis */}
									<div className="flex flex-col w-1/2">
										<label className="text-sm font-semibold text-gray-800">Date of Diagnosis:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.DIAGNOSIS
												? (!patientConsultInfo.DIAGNOSIS.DATE
													? "No diagnosis profile"
													: `${patientConsultInfo.DIAGNOSIS.DATE || "N/A"}`)
												: "N/A"}
										</span>
									</div>

									{/* Operation */}
									<div className="flex flex-col w-1/2">
										<label className="text-sm font-semibold text-gray-800">Operation:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.OPERATION
												? (!patientConsultInfo.OPERATION.SURGERY &&
													!patientConsultInfo.OPERATION.DATE
													? "No scheduled surgery"
													: `${patientConsultInfo.OPERATION.SURGERY || "N/A"} - ${patientConsultInfo.OPERATION.DATE || "N/A"}`)
												: "N/A"}
										</span>
									</div>
								</div>

								<div className="flex gap-4 w-full">
									{/* Chemotherapy */}
									<div className="flex flex-col w-1/3">
										<label className="text-sm font-semibold text-gray-800">Chemotherapy:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.CHEMOTHERAPY
												? patientConsultInfo.CHEMOTHERAPY.YN === "No" && !patientConsultInfo.CHEMOTHERAPY.COMPLETION
													? "No assigned chemotherapy"
													: `${patientConsultInfo.CHEMOTHERAPY.YN}, ${patientConsultInfo.CHEMOTHERAPY.COMPLETION || "N/A"}`
												: "N/A"}
										</span>
									</div>

									{/* Radiotherapy */}
									<div className="flex flex-col w-1/3">
										<label className="text-sm font-semibold text-gray-800">Radiotherapy:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.RADIOTHERAPY
												? patientConsultInfo.RADIOTHERAPY.YN === "No" && !patientConsultInfo.RADIOTHERAPY.COMPLETION
													? "No assigned radiotherapy"
													: `${patientConsultInfo.RADIOTHERAPY.YN}, ${patientConsultInfo.RADIOTHERAPY.COMPLETION || "N/A"}`
												: "N/A"}
										</span>
									</div>

									{/* Hormonal Therapy */}
									<div className="flex flex-col w-1/3">
										<label className="text-sm font-semibold text-gray-800">Hormonal Therapy:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.HORMONAL_THERAPY
												? patientConsultInfo.HORMONAL_THERAPY.YN === "No" && !patientConsultInfo.HORMONAL_THERAPY.COMPLIANCE
													? "No assigned hormonal therapy"
													: `${patientConsultInfo.HORMONAL_THERAPY.YN}, ${patientConsultInfo.HORMONAL_THERAPY.COMPLIANCE || "N/A"}`
												: "N/A"}
										</span>
									</div>

								</div>
							</div>
						</div>
						<div className="flex flex-col gap-2 mt-4">
							<h2 className="text-xl font-bold text-black">Consult Information</h2>
							<Separator className='' />
						</div>
						<div className="w-full">
							<div className="flex flex-col gap-6">
								{/* Patient Status */}
								<div className="flex flex-col">
									<label className="text-sm font-semibold text-gray-800">Patient Status:</label>
									<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
										{patientConsultInfo?.STATUS || "N/A"}
									</span>
								</div>

								<div className="flex gap-4">
									{/* Latest Consult Date */}
									<div className="flex flex-col w-1/3">
										<label className="text-sm font-semibold text-gray-800">Latest Consult Date:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.LATEST_CONSULT_DATE || "N/A"}
										</span>
									</div>

									{/* Latest Labs Submitted */}
									<div className="flex flex-col w-1/3">
										<label className="text-sm font-semibold text-gray-800">Latest Labs Submitted:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.LATEST_LAB_SUBMITTED || "N/A"}
										</span>
									</div>

									{/* Submission Date */}
									<div className="flex flex-col w-1/3">
										<label className="text-sm font-semibold text-gray-800">Submission Date:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.LATEST_LAB_DATE ?
												new Date(patientConsultInfo.LATEST_LAB_DATE).toISOString().split("T")[0]
												: "N/A"}
										</span>
									</div>
								</div>

								<div className="flex gap-4 w-full">
									{/* Patient Si/Sx Report */}
									<div className="flex flex-col w-1/2">
										<label className="text-sm font-semibold text-gray-800">Patient Si/Sx Report:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.PATIENT_SISX_REPORT || "No signs and symptoms"}
										</span>
									</div>

									{/* Patient Report Date */}
									<div className="flex flex-col w-1/2">
										<label className="text-sm font-semibold text-gray-800">Patient Report Date:</label>
										<span className="mt-1 p-2 border border-gray-300 rounded text-gray-900 bg-zinc-100">
											{patientConsultInfo?.PATIENT_REPORT_DATE || "N/A"}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>


					<div className="flex w-full py-8">
						{/* SUBMISSION box */}
						<form className="flex flex-col gap-6 w-3/4 pb-20" onSubmit={handleSubmit}>
							<div className="flex flex-col">
								<label className="text-sm font-semibold text-black">Subjective</label>
								<input
									name="CONSULT_SUBJECTIVE"
									value={formData.CONSULT_SUBJECTIVE}
									onChange={handleChange}
									className={`mt-1 p-2 text-black border ${errors.CONSULT_SUBJECTIVE ? "border-red-500" : "border-gray-300"} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
								/>
								{errors.CONSULT_SUBJECTIVE && <p className="text-red-500 text-xs mt-1">{errors.CONSULT_SUBJECTIVE}</p>}
							</div>
							<div className="flex flex-col">
								<label className="text-sm font-semibold text-black">Objective</label>
								<textarea
									name="CONSULT_OBJECTIVE"
									value={formData.CONSULT_OBJECTIVE}
									onChange={handleChange}
									className={`mt-1 p-2 min-h-40 text-black border ${errors.CONSULT_OBJECTIVE ? "border-red-500" : "border-gray-300"} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
									rows={10}
								/>
								{errors.CONSULT_OBJECTIVE && <p className="text-red-500 text-xs mt-1">{errors.CONSULT_OBJECTIVE}</p>}
							</div>
							<div className="flex flex-col">
								<label className="text-sm font-semibold text-black">Assessment</label>
								<input
									name="CONSULT_ASSESSMENT"
									value={formData.CONSULT_ASSESSMENT}
									onChange={handleChange}
									className={`mt-1 p-2 text-black border ${errors.CONSULT_ASSESSMENT ? "border-red-500" : "border-gray-300"} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
								/>
								{errors.CONSULT_ASSESSMENT && <p className="text-red-500 text-xs mt-1">{errors.CONSULT_ASSESSMENT}</p>}
							</div>
							<div className="flex flex-col">
								<label className="text-sm font-semibold text-black">RX Plan</label>
								<textarea
									name="CONSULT_RXPLAN"
									value={formData.CONSULT_RXPLAN}
									onChange={handleChange}
									className={`mt-1 p-2 min-h-40 text-black border ${errors.CONSULT_RXPLAN ? "border-red-500" : "border-gray-300"} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
									rows={10}
								/>
								{errors.CONSULT_RXPLAN && <p className="text-red-500 text-xs mt-1">{errors.CONSULT_RXPLAN}</p>}
							</div>
							<div className="flex flex-col">
								<label className="text-sm font-semibold text-black">Surveillance/Workup</label>
								<input
									name="CONSULT_SURVWORKUP"
									value={formData.CONSULT_SURVWORKUP}
									onChange={handleChange}
									className={`mt-1 p-2 text-black border ${errors.CONSULT_SURVWORKUP ? "border-red-500" : "border-gray-300"} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
								/>
								{errors.CONSULT_SURVWORKUP && <p className="text-red-500 text-xs mt-1">{errors.CONSULT_SURVWORKUP}</p>}
							</div>

							<div className="flex flex-col">
								<label className="text-sm font-semibold text-black">Patient Status</label>
								<select
									name="CONSULT_PATIENTSTATUS"
									value={formData.CONSULT_PATIENTSTATUS}
									onChange={handleChange}
									className={`mt-1 p-2 border ${errors.CONSULT_PATIENTSTATUS ? "border-red-500" : "border-gray-300"} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
								>
									<option value="1">Alive</option>
									<option value="2">Symptoms</option>
									<option value="3">Recurrence</option>
									<option value="4">Metastatic</option>
									<option value="5">Curative</option>
									<option value="6">Recovered</option>
									<option value="7">Improved</option>
									<option value="8">Unimproved</option>
									<option value="9">Died</option>
								</select>
								{errors.CONSULT_PATIENTSTATUS && <p className="text-red-500 text-xs mt-1">{errors.CONSULT_PATIENTSTATUS}</p>}
							</div>
							<div className="flex justify-center mt-6">
								<button type="submit" className="bg-red-900 text-white py-2 px-6 rounded">
									Submit
								</button>
							</div>
						</form>


						{/* BUTTONS*/}
						<div className="col-span-1 bg-white p-4">
							<div className="grid grid-cols-1 grid-flow-col ">
								<div className="flex flex-col gap-4">

									<Dialog>
										<DialogTrigger>
											<div className="w-full hover:bg-red-800 font-semibold bg-red-900 text-white p-4 rounded shadow">
												UPDATE PATIENT INFO
											</div>
										</DialogTrigger>
										<DialogContent className="bg-white p-4 w-full max-w-3xl">
											<div className="w-full p-4">
												<div className="flex gap-4 items-center mb-4">
													<h1 className="text-2xl font-bold text-black">Patient Information</h1>
													<Edit
														className="text-black cursor-pointer"
														onClick={() => setEditMode((prev) => !prev)}
													/>
												</div>
												<Separator className="mb-4 bg-zinc-400" />
												{patient ? (
													<form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
														<div className="flex gap-4">
															<div className="flex flex-col mb-4 w-1/2">
																<label className="text-sm font-semibold text-gray-700">Name:</label>
																{editMode ? (
																	<input
																		type="text"
																		value={editData.USER_FIRSTNAME}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_FIRSTNAME: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{`${patient.user.userFirstname} ${patient.user.userMiddlename} ${patient.user.userLastname}`}
																	</label>
																)}
															</div>
															<div className="flex flex-col mb-4 w-1/2">
																<label className="text-sm font-semibold text-gray-700">Email:</label>
																{editMode ? (
																	<input
																		type="email"
																		value={editData.USER_EMAIL}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_EMAIL: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{patient.user.userEmail}
																	</label>
																)}
															</div>
														</div>
														<div className="flex gap-4">
															<div className="flex flex-col mb-4 w-1/3">
																<label className="text-sm font-semibold text-gray-700">Gender:</label>
																{editMode ? (
																	<input
																		type="text"
																		value={editData.USER_GENDER}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_GENDER: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{patient.user.userGender}
																	</label>
																)}
															</div>
															<div className="flex flex-col mb-4 w-1/3">
																<label className="text-sm font-semibold text-gray-700">Marital Status:</label>
																{editMode ? (
																	<input
																		type="text"
																		value={editData.USER_MARITAL_STATUS}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_MARITAL_STATUS: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{patient.user.userMaritalStatus}
																	</label>
																)}
															</div>
															<div className="flex flex-col mb-4 w-1/3">
																<label className="text-sm font-semibold text-gray-700">Contact No.:</label>
																{editMode ? (
																	<input
																		type="text"
																		value={editData.USER_CONTACTNO}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_CONTACTNO: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{patient.user.userContactno}
																	</label>
																)}
															</div>
														</div>
														<div className="flex gap-4">
															<div className="flex flex-col mb-4 w-1/2">
																<label className="text-sm font-semibold text-gray-700">Birthdate:</label>
																{editMode ? (
																	<input
																		type="date"
																		value={editData.USER_BIRTHDATE}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_BIRTHDATE: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{new Date(patient.user.userBirthdate).toLocaleDateString()}
																	</label>
																)}
															</div>
															<div className="flex flex-col mb-4 w-1/2">
																<label className="text-sm font-semibold text-gray-700">Birthplace:</label>
																{editMode ? (
																	<input
																		type="text"
																		value={editData.USER_BIRTHPLACE}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				USER_BIRTHPLACE: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black"
																	/>
																) : (
																	<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																		{patient.user.userBirthplace}
																	</label>
																)}
															</div>
														</div>
														<div className="flex flex-col mb-4">
															<label className="text-sm font-semibold text-gray-700">Address:</label>
															{editMode ? (
																<div className="flex gap-2">
																	<input
																		type="text"
																		placeholder="Number"
																		value={editData.ADDRESS_NUMBER || ""}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				ADDRESS_NUMBER: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black w-1/5"
																	/>
																	<input
																		type="text"
																		placeholder="Street"
																		value={editData.ADDRESS_STREET || ""}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				ADDRESS_STREET: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black w-4/12"
																	/>
																	<input
																		type="text"
																		placeholder="City"
																		value={editData.ADDRESS_CITY || ""}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				ADDRESS_CITY: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black w-1/5"
																	/>
																	<input
																		type="text"
																		placeholder="Region"
																		value={editData.ADDRESS_REGION || ""}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				ADDRESS_REGION: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black w-1/5"
																	/>
																	<input
																		type="text"
																		placeholder="Zip Code"
																		value={editData.ADDRESS_ZIPCODE || ""}
																		onChange={(e) =>
																			setEditData((prev) => ({
																				...prev,
																				ADDRESS_ZIPCODE: e.target.value,
																			}))
																		}
																		className="mt-1 p-2 border border-gray-300 rounded text-black w-1/5"
																	/>

																</div>
															) : (
																<label className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black">
																	{`${patient.user.userAddress.addressNumber} ${patient.user.userAddress.addressStreet}, ${patient.user.userAddress.addressCity}, ${patient.user.userAddress.addressRegion} ${patient.user.userAddress.addressZipcode}`}
																</label>
															)}
														</div>
														{editMode && (
															<div className="flex justify-end gap-2 mt-4">
																<button
																	type="button"
																	onClick={() => setEditMode(false)}
																	className="bg-gray-300 text-black p-2 rounded"
																>
																	Cancel
																</button>
																<button
																	type="submit"
																	className="bg-red-900 text-white p-2 rounded"
																>
																	Save Changes
																</button>
															</div>
														)}
													</form>
												) : (
													<div className="">No patient found.</div>
												)}
											</div>
										</DialogContent>
									</Dialog>

									<Dialog>
										<DialogTrigger>
											<div className="w-full hover:bg-red-800 font-semibold bg-red-900 text-white p-4 rounded shadow">
												PRESCRIPTION
											</div>
										</DialogTrigger>
										<DialogContent className="bg-white p-4">
											<DynamicPDFForm
												title="Prescription Form"
												label="Prescription"
												pdfTitle="Prescription"
												fieldPlaceholder="Enter prescription details"
												filenamePrefix="Prescription"
											/>
										</DialogContent>
									</Dialog>

									<Dialog>
										<DialogTrigger>
											<div className="w-full hover:bg-red-800 font-semibold bg-red-900 text-white p-4 rounded shadow">LAB REQUEST</div>
										</DialogTrigger>
										<DialogContent className="bg-white p-4">
											<DynamicPDFForm
												title="Laboratory Request Form"
												label="Laboratory Name"
												pdfTitle="Laboratory Request"
												fieldPlaceholder="Enter Laboratory Name"
												filenamePrefix="LaboratoryRequest"
											/>
										</DialogContent>
									</Dialog>

									<Dialog>
										<DialogTrigger>
											<div
												className="w-full hover:bg-red-800 font-semibold bg-red-900 text-white p-4 rounded shadow"
											>
												CLINICAL ABSTRACT
											</div>
										</DialogTrigger>
										<DialogContent className="bg-white p-4 h-[70%] w-4/5 max-w-3xl">
											<DynamicPDFProgressReport />
										</DialogContent>
									</Dialog>

									<Dialog>
										<DialogTrigger>
											<div
												className="w-full hover:bg-red-800 font-semibold bg-red-900 text-white p-4 rounded shadow"
											>
												MEDICAL CERTIFICATE
											</div>
										</DialogTrigger>
										<DialogContent className="bg-white p-4 h-[70%] w-4/5 max-w-3xl">
											<MedicalCertificatePDF
												title="Medical Certificate"
												pdfTitle="Medical Certificate"
												filenamePrefix="MedicalCertificate"
											/>
										</DialogContent>
									</Dialog>

									<Dialog>
										<DialogTrigger>
											<div
												className="w-full hover:bg-red-800 font-semibold bg-red-900 text-white p-4 rounded shadow"
											>
												REFERRAL FORM
											</div>
										</DialogTrigger>
										<DialogContent className="bg-white p-4">
											<ReferralPDFForm
												title="Referral Form"
												pdfTitle="Referral Document"
												fieldPlaceholder="Enter reason for referral..."
												filenamePrefix="Referral"
											/>
										</DialogContent>
									</Dialog>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConsultPage;