"use client";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
import { Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface Notification {
  notifLogID: number;
  notificationDate: string;
  notificationSender: {
    userFirstname: string;
    userLastname: string;
    userEmail: string;
    userId: string;
  };
  notificationNotes: string;
}

type NotificationSender = {
  userFirstname: string;
  userLastname: string;
  userEmail: string;
  userId: string;
};

type NotificationType = {
  notifLogID: number;
  notificationDate: string; // ISO date string
  notificationSender: NotificationSender;
  notificationNotes: string;
};

interface EmailFormData {
  subject: string;
  messageBody: string;
  recieverID: number;
  senderID: number;
  recieverEmail: string;
  senderEmail: string;
  notificationType: number;
}

const NotificationPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}css/notif/log/${parsedUserData.user.userId}/all`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          const parsedData = data.map((item: NotificationType) => ({
            notifLogID: item.notifLogID,
            notificationDate: new Date(item.notificationDate).toISOString().split("T")[0],
            notificationSender: {
              userFirstname: item.notificationSender.userFirstname,
              userLastname: item.notificationSender.userLastname,
              userEmail: item.notificationSender.userEmail,
              userId: item.notificationSender.userId,
            },
            notificationNotes: item.notificationNotes,
          }));
          setNotifications(parsedData);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      };
    }

    fetchNotifications();
  }, []);

  const [userInfo, setUserInfo] = useState({
    userFirstname: '',
    userLastname: '',
    role: '',
    email: '',
    userId: '',
  });

  useEffect(() => {
    const setFormDetails = async () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if ('doctorId' in parsedUserData) {
          setUserInfo({
            userFirstname: parsedUserData.user.userFirstname,
            userLastname: parsedUserData.user.userLastname,
            role: 'Doctor',
            email: parsedUserData.user.userEmail,
            userId: parsedUserData.user.userId,
          });
          setFormData((prev) => ({ ...prev, senderEmail: parsedUserData.user.userEmail, senderID: parsedUserData.user.userId }));
        } else if ('patientId' in parsedUserData) {
          setUserInfo({
            userFirstname: parsedUserData.user.userFirstname,
            userLastname: parsedUserData.user.userLastname,
            role: 'Patient',
            email: parsedUserData.user.userEmail,
            userId: parsedUserData.user.userId,
          });
          setFormData((prev) => ({ ...prev, senderEmail: parsedUserData.user.userEmail, senderID: parsedUserData.user.userId }));
        }
      }
    };

    setFormDetails();
  }, [])

  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    messageBody: '',
    recieverID: 1, // Default value (this should be dynamically set if needed)
    senderID: 1,  // Default value (this should be dynamically set if needed)
    recieverEmail: '',
    senderEmail: '',
    notificationType: 1, // Assuming a default notification type
  });

  const [errors, setErrors] = useState<Partial<EmailFormData>>({});
  const [loading, setLoading] = useState(false); // Loading state

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<EmailFormData> = {};
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.messageBody) newErrors.messageBody = 'Message body is required';
    if (!formData.recieverEmail) newErrors.recieverEmail = 'Receiver email is required';
    if (!formData.senderEmail) newErrors.senderEmail = 'Sender email is required';
    console.log(newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //patient search  



  useEffect(() => {
    const fetchDoctorDetails = async () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if ('patientId' in parsedUserData) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/doctor/finddoctorsbypatient?patientID=${parsedUserData.patientId}`);
            const data = await response.json();
            if (data && data.length > 0) {
              const doctor = data[0];
              setFormData((prev) => ({
                ...prev,
                recieverEmail: doctor.user.userEmail,
                recieverID: doctor.user.userId,
              }));
            } else {
              console.warn("No doctor details found for the patient.");
            }
          } catch (error) {
            console.error("Error fetching doctor details:", error);
          }
        }
      }
    };

    fetchDoctorDetails();
  }, []);

  const { toast } = useToast();

  const handleSubmit = (messageToReply: string) => async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      console.log(errors);
      alert("Invalid message");
      return;
    }
    setLoading(true);

    const requestBody = {
      subject: formData.subject,
      messageBody: `>${messageToReply}\n\n${formData.messageBody}`,
      recieverID: formData.recieverID,
      senderID: formData.senderID,
      recieverEmail: formData.recieverEmail,
      senderEmail: formData.senderEmail,
      notificationType: formData.notificationType,
    };

    try {
      console.log(requestBody);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}css/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Failed to send email');
      } else {
        toast({ title: "Email sent successfully!" });
        if (userInfo.role === "Doctor") {
          setFormData({
            subject: '',
            messageBody: '',
            recieverID: 1,
            senderID: 1,
            recieverEmail: '',
            senderEmail: requestBody.senderEmail,
            notificationType: 1,
          });
        } else {
          setFormData({
            subject: '',
            messageBody: '',
            recieverID: 1,
            senderID: 1,
            recieverEmail: formData.recieverEmail,
            senderEmail: requestBody.senderEmail,
            notificationType: 1,
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-5/6 bg-white flex flex-col items-center px-6 h-screen">
      <div className="w-6/12 h-auto mt-12 p-2 text-center">
        <p className="font-bold text-6xl text-red-900 text-nowrap	tracking-wide">ALERT</p>
      </div>

      {/* Table Section */}
      <div className="w-full max-w-4xl h-3/6 bg-white p-6 overflow-y-auto">
        <Table>
          <TableHeader className=" ">
            <TableRow className="bg-red-50 hover:bg-red-100">
              <TableHead className="font-medium text-sm text-gray-700 py-3 w-1/5">
                Date
              </TableHead>
              <TableHead className="font-medium text-sm text-gray-700 py-3 w-1/5">
                Sender
              </TableHead>
              <TableHead className="font-medium text-sm text-gray-700 py-3 w-3/5 text-center">
                Message
              </TableHead>
              <TableHead className="font-medium text-sm text-gray-700 py-3 w-1/6 text-center">

              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <TableRow key={notification.notifLogID}>
                  <TableCell className="text-sm text-gray-700 bg-white py-2">
                    {notification.notificationDate}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 bg-white py-2">
                    {`${notification.notificationSender.userFirstname} ${notification.notificationSender.userLastname}`}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 bg-white py-2">
                    {notification.notificationNotes}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 bg-white py-2">
                    <Dialog>
                      <DialogTrigger>
                        <Reply
                          onClick={() => { setFormData((prev) => ({ ...prev, recieverEmail: notification.notificationSender.userEmail, recieverID: Number(notification.notificationSender.userId) })) }}
                        />
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-3xl bg-white rounded-lg">
                        <div className="w-full max-w-4xl bg-white rounded-lg ">
                          <div className="grid grid-cols-1 gap-6">
                            {/* Form Inputs */}
                            <div className="p-6 rounded-lg "
                            // onSubmit={handleSubmit}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* TO Input */}
                                {notification && (
                                  <div className="flex flex-col">
                                    <label className="font-semibold text-sm text-black mb-2">TO:</label>
                                    <div className="mt-1 p-2 border rounded-md bg-zinc-200 border-zinc-300 text-black">
                                      <Label className="text-base">{`${notification.notificationSender.userFirstname} ${notification.notificationSender.userLastname}` || "No email selected"}</Label>
                                    </div>
                                  </div>
                                )}

                                {/* SUBJECT Input */}
                                <div className="flex flex-col">
                                  <label className="font-semibold text-sm text-black mb-2">SUBJECT:</label>
                                  <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={`mt-1 p-2 text-black border ${errors.subject ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                    placeholder="Subject of the Message"
                                  />
                                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                                </div>

                                {/* MESSAGE Input */}
                                <div className="flex flex-col col-span-2">
                                  <label className="font-semibold text-sm text-black mb-2">MESSAGE:</label>
                                  <textarea
                                    name="messageBody"
                                    value={formData.messageBody}
                                    onChange={handleChange}
                                    className={`mt-1 p-2 min-h-40 text-black border ${errors.messageBody ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                    placeholder="Type your message here"
                                    rows={20}
                                  />
                                  {errors.messageBody && <p className="text-red-500 text-xs mt-1">{errors.messageBody}</p>}
                                </div>
                              </div>

                              {/* Submit Button */}
                              <div className="flex justify-center items-center mt-6 flex-col">
                                {loading ? (
                                  <div className="w-32 py-2 bg-red-900 flex items-center justify-center rounded-lg hover:cursor-not-allowed">
                                    <div
                                      className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                                      role="status">
                                    </div>
                                    <span className="ml-2 text-white font-semibold">Sending...</span>
                                  </div>
                                ) : (
                                  <button
                                    // type="submit"
                                    onClick={handleSubmit(notification.notificationNotes)}
                                    className="w-32 bg-red-900 text-white font-semibold py-2 px-8 rounded-lg shadow-lg hover:bg-red-800 transition duration-200"
                                  >
                                    Send
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  rowSpan={3}
                  colSpan={3}
                  className="text-sm text-gray-700 bg-white py-2 text-center items-center"
                >
                  No emails received.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </div>

      {/* System Message Section */}
      {userInfo.role === "Doctor" && (
        <div className="w-full max-w-4xl mt-8 bg-white p-6">
          <div className="mb-4">
            <p className="font-semibold text-lg text-gray-800">
              SYSTEM MESSAGE:
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-md">
            <div className="space-y-4 flex">
              <p className="font-medium text-sm text-gray-800">
                Number of notifications:<b> {notifications.length} </b>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
