"use client"

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import emailjs from 'emailjs-com';
import { ChangeEvent, FormEvent, useState } from 'react';

const Patient = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await emailjs.send(
        'service_h5772rj', // Replace with your EmailJS service ID
        'template_z0hr5m2', // Replace with your EmailJS template ID
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
        'IgPKx5E_OM7pLJORV' // Replace with your EmailJS Public Key
      );

      setSuccessMessage('Thank you! Your inquiry has been sent.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setErrorMessage('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='w-full text-black flex flex-col items-center bg-white min-h-screen pt-32 pb-20'>
      {/* Header Section */}
      <div className='text-center mb-12'>
        <Label className='text-6xl font-semibold text-black'>Contact Us</Label>
      </div>

      {/* Contact Table Section */}
      <div className='w-full flex justify-center overflow-x-auto max-w-7xl'>
        <Table className='w-full'>
          <TableHeader className='bg-gray-200'>
            <TableRow>
              <TableHead className='text-center text-gray-800 font-semibold text-lg'>Email</TableHead>
              <TableHead className='text-center text-gray-800 font-semibold text-lg'>Contact Number</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className='hover:bg-gray-100'>
              <TableCell className='text-center text-gray-600'>mbguillermo2@up.edu.ph</TableCell>
              <TableCell className='text-center text-gray-600'>0949 998 8305</TableCell>
            </TableRow>
            <TableRow className='hover:bg-gray-100'>
              <TableCell className='text-center text-gray-600'>agpanes@up.edu.ph</TableCell>
              <TableCell className='text-center text-gray-600'>0951 954 7948</TableCell>
            </TableRow>
            <TableRow className='hover:bg-gray-100'>
              <TableCell className='text-center text-gray-600'>cbparinas@up.edu.ph</TableCell>
              <TableCell className='text-center text-gray-600'>0917 723 0121</TableCell>
            </TableRow>
            <TableRow className='hover:bg-gray-100'>
              <TableCell className='text-center text-gray-600'>nbcallang@up.edu.ph</TableCell>
              <TableCell className='text-center text-gray-600'>0908 777 5482</TableCell>
            </TableRow>
            <TableRow className='hover:bg-gray-100'>
              <TableCell className='text-center text-gray-600'>rsgomez1@up.edu.ph</TableCell>
              <TableCell className='text-center text-gray-600'>0927 044 2113</TableCell>
            </TableRow>
            <TableRow className='hover:bg-gray-100'>
              <TableCell className='text-center text-gray-600'>deercia@up.edu.ph</TableCell>
              <TableCell className='text-center text-gray-600'>0998 957 2078</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Address Section */}
      <div className='py-10 text-center'>
        <Label className='text-2xl font-bold text-gray-800'>Address</Label>
        <p className='text-xl text-gray-600 mt-4'>
          University of the Philippines Manila, Padre Faura St, Ermita, Manila, 1000 Metro Manila
        </p>
      </div>

      {/* Inquiry Form Section */}
      <div className='w-full max-w-5xl bg-zinc-200 rounded-xl p-6 flex justify-center flex-col'>
        <Label className='text-2xl font-semibold text-gray-800 text-center mb-4'>Need to inquire?</Label>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className='mb-4 w-1/2'>
              <Label htmlFor='name' className='block text-gray-700 font-medium mb-2'>
                Name
              </Label>
              <input
                type='text'
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900'
                required
              />
            </div>

            <div className='mb-4 w-1/2'>
              <Label htmlFor='email' className='block text-gray-700 font-medium mb-2'>
                Email
              </Label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900'
                required
              />
            </div>
          </div>

          <div className='mb-4'>
            <Label htmlFor='message' className='block text-gray-700 font-medium mb-2'>
              Message
            </Label>
            <textarea
              id='message'
              name='message'
              value={formData.message}
              onChange={handleChange}
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900'
              rows={8}
              required
            ></textarea>
          </div>

          {successMessage && <p className='text-green-600 text-center mb-4'>{successMessage}</p>}
          {errorMessage && <p className='text-red-600 text-center mb-4'>{errorMessage}</p>}

          <Button
            type='submit'
            className='w-full bg-red-900 hover:bg-red-700 text-white rounded-lg py-2'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Submit'}
          </Button>
        </form>
      </div>

      {/* Call to Action Section */}
      <div className='py-4 text-center kalam-font'>
        <div className='flex flex-col gap-5 items-center'>
          <div className='flex gap-5'>
            <Label className='text-red-600 text-5xl font-bold'>Magkasama</Label>
            <Label className='text-gray-800 text-5xl font-bold'>natin</Label>
          </div>
          <Label className='text-gray-800 text-5xl font-bold'>puksain ang kanser</Label>
        </div>
      </div>

      {/* Footer Section */}
      <div className='text-center mt-12'>
        <Label className='text-lg font-medium text-gray-800'>Interested? Learn more.</Label>
        <div className='flex justify-center gap-6 mt-6'>
          <Button
            onClick={() => router.push("/tutorial")}
            className='bg-red-900 hover:bg-red-700 text-white rounded-full px-6 py-3 text-lg'>
            How to use CSS
          </Button>
          <Button
            onClick={() => router.push("/patient")}
            className='bg-red-900 hover:bg-red-700 text-white rounded-full px-6 py-3 text-lg'>
            Why Patients Use CSS
          </Button>
          <Button
            onClick={() => router.push("/doctor")}
            className='bg-red-900 hover:bg-red-700 text-white rounded-full px-6 py-3 text-lg'>
            Why Doctors Use CSS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Patient;