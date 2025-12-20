import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';

function UserList({ users, selectedUser, onSelectUser, loading, error }) {
  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b' }}>
          Chats
        </Typography>
      </Box>

      {loading ? (
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Loading users...
          </Typography>
        </Box>
      ) : error ? (
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      ) : !users || users.length === 0 ? (
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          px={2}
        >
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No users available
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5 }}>
            Register another user to start chatting
          </Typography>
        </Box>
      ) : (
        <List
          sx={{
            width: '100%',
            flex: 1,
            overflow: 'auto',
            py: 0,
          }}
        >
          {users.map((user, index) => {
            const isSelected = selectedUser?._id === user._id;

            return (
              <React.Fragment key={user._id}>
                <ListItemButton
                  onClick={() => onSelectUser(user)}
                  selected={isSelected}
                  sx={{
                    alignItems: 'center',
                    bgcolor: isSelected ? '#e3f2fd' : '#ffffff',
                    borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
                    '&.Mui-selected:hover': {
                      bgcolor: '#e3f2fd',
                    },
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                    py: 1.5,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: '#1976d2',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>

                  <Box
                    flex={1}
                    minWidth={0}
                    display="flex"
                    flexDirection="column"
                  >
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                      }}
                    >
                      {user.name}
                    </Typography>
                  </Box>
                </ListItemButton>

                {index < users.length - 1 && <Divider component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
}

export default UserList;