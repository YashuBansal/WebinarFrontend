import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { VisibilityIcon } from '../SVGs';

const tableCellStyles = {
    paddingTop: "6px",
    paddingBottom: "6px",
    color: "#555A68",
  };

const AssignmentActivity = ({ label, array }) => {
    const navigate = useNavigate();
  return (
    <Box className="p-4 border rounded-md shadow-md bg-white">
      <Typography variant="h6" className=" text-center text-gray-800 border-b pb-2">
        {label}
      </Typography>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Webinar</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {array.map((item, index) => (
              <TableRow key={index}>
                <TableCell sx={tableCellStyles} >{item.email}</TableCell>
                <TableCell sx={tableCellStyles}>{item.webinar}</TableCell>
                <TableCell align="center" sx={tableCellStyles}>
                  <IconButton
                  onClick={() => {
                    navigate(
                        `/particularContact?email=${item?.email}`
                      );}
                  }
                  >
                    <img src={VisibilityIcon} alt="Bookmark" className="min-h-6 h-6 w-6 min-w-6" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};


export default AssignmentActivity;
