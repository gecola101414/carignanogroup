#!/bin/bash
sed -i '/  return (/i \
  if (!currentUser) {\n\
    return (\n\
      <LoginScreen\n\
        credentials={credentials}\n\
        onLogin={(user) => {\n\
          setCurrentUser(user);\n\
          sessionStorage.setItem("current_user", JSON.stringify(user));\n\
        }}\n\
        onUpdatePassword={(username, newPassword) => {\n\
          const updatedCreds = credentials.map(c => \n\
            c.username.toLowerCase() === username.toLowerCase() \n\
              ? { ...c, passwordHash: newPassword, mustChange: false } \n\
              : c\n\
          );\n\
          handleUpdateCredentials(updatedCreds);\n\
        }}\n\
      />\n\
    );\n\
  }\n\
' src/App.tsx
