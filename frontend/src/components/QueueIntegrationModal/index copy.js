import React, { useState, useEffect } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  TextField,
  
  Grid,
  Paper,
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";


const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  btnLeft: {
    display: "flex",
    marginRight: "auto",
    marginLeft: 12,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
}));

const DialogflowSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  // projectName: Yup.string()
  //   .min(3, "Too Short!")
  //   .max(100, "Too Long!")
  //   .required(),
  // jsonContent: Yup.string().min(3, "Too Short!").required(),
  // language: Yup.string().min(2, "Too Short!").max(50, "Too Long!").required(),
});

const SessionSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
});


const QueueIntegration = ({ open, onClose, integrationId, whatsAppId }) => {
  const classes = useStyles();

  const initialState = {
    type: "typebot",
    name: "",
    projectName: "",
    jsonContent: "",
    language: "",
    urlN8N: "",
    typebotDelayMessage: 1000,
    typebotExpires: 1,
    typebotKeywordFinish: "",
    typebotKeywordRestart: "",
    typebotRestartMessage: "",
    typebotSlug: "",
    typebotUnknownMessage: "",
    reetingMessage: "",
		farewellMessage: "",
		isDefault: false,

  };

  const [integration, setIntegration] = useState(initialState);
  const [isHubSelected, setIsHubSelected] = useState(false);
	const [availableChannels, setAvailableChannels] = useState([]);
	const [selectedChannel, setSelectedChannel] = useState("");
  const [whatsApp, setWhatsApp] = useState(initialState);
	const [selectedQueueIds, setSelectedQueueIds] = useState([]);


  // Função para buscar os canais disponíveis no hub
// Função para buscar os canais disponíveis no hub
const fetchChannels = async () => {
  try {
    const { data } = await api.get("/hub-channel/");
    console.log("Canais disponíveis:", data); // Adicione isso para verificar os dados recebidos
    setAvailableChannels(data);
  } catch (err) {
    toastError(err);
  }
};

useEffect(() => {
  console.log("selectedChannel has changed:", selectedChannel);
}, [selectedChannel]);

useEffect(() => {
  const fetchSession = async () => {
    if (!whatsAppId) return;

    try {
      const { data } = await api.get(`whatsapp/${whatsAppId}`);
      setWhatsApp(data);

      const whatsQueueIds = data.queues?.map(queue => queue.id);
      setSelectedQueueIds(whatsQueueIds);
    } catch (err) {
      toastError(err);
    }
  };
  fetchSession();
}, [whatsAppId]);
 

  useEffect(() => {
    (async () => {
      if (!integrationId) return;
      try {
        const { data } = await api.get(`/queueIntegration/${integrationId}`);
        setIntegration((prevState) => {
          return { ...prevState, ...data };
        });
      } catch (err) {
        toastError(err);
      }
    })();

    return () => {
      setIntegration({
        type: "dialogflow",
        name: "",
        projectName: "",
        jsonContent: "",
        language: "",
        urlN8N: "",
        typebotDelayMessage: 1000
      });
    };

  }, [integrationId, open]);

  const handleClose = () => {
    onClose();
    setIntegration(initialState);
    setWhatsApp(initialState);
		setIsHubSelected(false);
		setSelectedChannel("");
  };

  const handleTestSession = async (event, values) => {
    try {
      if(values.type === 'hubhubtoken') values.projectName = values.name
      const { projectName, jsonContent, language } = values;
      if(integrationId){
      await api.post(`/queueIntegration/testSession`, {
        projectName,
        jsonContent,
        language,
      });

      toast.success(i18n.t("queueIntegrationModal.messages.testSuccess"));
    }else{
      await api.post("/queueIntegration", values);
        toast.success(i18n.t("queueIntegrationModal.messages.addSuccess"));
    }

    } 
    catch (err) {
      toastError(err);
    }
  };

  const handleSaveDialogflow = async (values) => {
    try {
      if (values.type === 'n8n' || values.type === 'webhook' || values.type === 'typebot'|| values.type === 'hub') values.projectName = values.name
      if (integrationId) {
        await api.put(`/queueIntegration/${integrationId}`, values);
        toast.success(i18n.t("queueIntegrationModal.messages.editSuccess"));
      } else {
        await api.post("/queueIntegration", values);
        toast.success(i18n.t("queueIntegrationModal.messages.addSuccess"));
      }
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };


  const handleSaveWhatsApp = async values => {
		const whatsappData = { ...values, queueIds: selectedQueueIds };

		


  return (
    <div className={classes.root}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>
          {integrationId
            ? `${i18n.t("queueIntegrationModal.title.edit")}`
            : `${i18n.t("queueIntegrationModal.title.add")}`}
            {whatsAppId
						? i18n.t("whatsappModal.title.edit")
						: i18n.t("whatsappModal.title.add")}
        </DialogTitle>
        <Formik
          initialValues={integration}
          enableReinitialize={true}
          validationSchema={DialogflowSchema}
          onSubmit={(values, actions, event) => {
            setTimeout(() => {
              handleSaveDialogflow(values);
              actions.setSubmitting(false);
            }, 400);
          }}
          
        >
        <Formik
					initialValues={whatsApp}
					enableReinitialize={true}
					validationSchema={SessionSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveWhatsApp(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				></Formik>

          {({ touched, errors, isSubmitting, values }) => (
            <Form>
              <Paper square className={classes.mainPaper} elevation={1}>
                <DialogContent dividers>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6} xl={6}>
                      <FormControl
                        variant="outlined"
                        className={classes.formControl}
                        margin="dense"
                        fullWidth
                      >
                        <InputLabel id="type-selection-input-label">
                          {i18n.t("queueIntegrationModal.form.type")}
                        </InputLabel>

                        <Field
                          as={Select}
                          label={i18n.t("queueIntegrationModal.form.type")}
                          name="type"
                          labelId="profile-selection-label"
                          error={touched.type && Boolean(errors.type)}
                          helpertext={touched.type && errors.type}
                          id="type"
                          required
                        >
                          <MenuItem value="dialogflow">DialogFlow</MenuItem>
                          <MenuItem value="n8n">N8N</MenuItem>
                          <MenuItem value="webhook">WebHooks</MenuItem>
                          <MenuItem value="typebot">Typebot</MenuItem>
                          <MenuItem value="hub">hub</MenuItem>
                        </Field>
                      </FormControl>
                    </Grid>
                    {values.type === "dialogflow" && (
                      <>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.name")}
                            autoFocus
                            name="name"
                            fullWidth
                            error={touched.name && Boolean(errors.name)}
                            helpertext={touched.name && errors.name}
                            variant="outlined"
                            margin="dense"
                            className={classes.textField}
                          />
                          <Field
										          as={TextField}
                              label={i18n.t("whatsappModal.form.name")}
                              autoFocus
                              name="name"
                              error={touched.name && Boolean(errors.name)}
                              helperText={touched.name && errors.name}
                              variant="outlined"
                              margin="dense"
                              className={classes.textField}
									          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            margin="dense"
                            fullWidth
                          >
                            <InputLabel id="language-selection-input-label">
                              {i18n.t("queueIntegrationModal.form.language")}
                            </InputLabel>

                            <Field
                              as={Select}
                              label={i18n.t("queueIntegrationModal.form.language")}
                              name="language"
                              labelId="profile-selection-label"
                              fullWidth
                              error={touched.language && Boolean(errors.language)}
                              helpertext={touched.language && errors.language}
                              id="language-selection"
                              required
                            >
                              <MenuItem value="pt-BR">Portugues</MenuItem>
                              <MenuItem value="en">Inglês</MenuItem>
                              <MenuItem value="es">Español</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.projectName")}
                            name="projectName"
                            error={touched.projectName && Boolean(errors.projectName)}
                            helpertext={touched.projectName && errors.projectName}
                            fullWidth
                            variant="outlined"
                            margin="dense"
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.jsonContent")}
                            type="jsonContent"
                            multiline
                            //inputRef={greetingRef}
                            maxRows={5}
                            minRows={5}
                            fullWidth
                            name="jsonContent"
                            error={touched.jsonContent && Boolean(errors.jsonContent)}
                            helpertext={touched.jsonContent && errors.jsonContent}
                            variant="outlined"
                            margin="dense"
                          />
                        </Grid>
                      </>
                    )}

                    {(values.type === "n8n" || values.type === "webhook" || values.type === "hub") && (
                      <>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.name")}
                            autoFocus
                            required
                            name="name"
                            error={touched.name && Boolean(errors.name)}
                            helpertext={touched.name && errors.name}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.urlN8N")}
                            name="urlN8N"
                            error={touched.urlN8N && Boolean(errors.urlN8N)}
                            helpertext={touched.urlN8N && errors.urlN8N}
                            variant="outlined"
                            margin="dense"
                            required
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                      </>
                    )}

                    
                    {(values.type === "typebot") && (
                      <>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.name")}
                            autoFocus
                            name="name"
                            error={touched.name && Boolean(errors.name)}
                            helpertext={touched.name && errors.name}
                            variant="outlined"
                            margin="dense"
                            required
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.urlN8N")}
                            name="urlN8N"
                            error={touched.urlN8N && Boolean(errors.urlN8N)}
                            helpertext={touched.urlN8N && errors.urlN8N}
                            variant="outlined"
                            margin="dense"
                            required
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotSlug")}
                            name="typebotSlug"
                            error={touched.typebotSlug && Boolean(errors.typebotSlug)}
                            helpertext={touched.typebotSlug && errors.typebotSlug}
                            required
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotExpires")}
                            name="typebotExpires"
                            error={touched.typebotExpires && Boolean(errors.typebotExpires)}
                            helpertext={touched.typebotExpires && errors.typebotExpires}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotDelayMessage")}
                            name="typebotDelayMessage"
                            error={touched.typebotDelayMessage && Boolean(errors.typebotDelayMessage)}
                            helpertext={touched.typebotDelayMessage && errors.typebotDelayMessage}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotKeywordFinish")}
                            name="typebotKeywordFinish"
                            error={touched.typebotKeywordFinish && Boolean(errors.typebotKeywordFinish)}
                            helpertext={touched.typebotKeywordFinish && errors.typebotKeywordFinish}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotKeywordRestart")}
                            name="typebotKeywordRestart"
                            error={touched.typebotKeywordRestart && Boolean(errors.typebotKeywordRestart)}
                            helpertext={touched.typebotKeywordRestart && errors.typebotKeywordRestart}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotUnknownMessage")}
                            name="typebotUnknownMessage"
                            error={touched.typebotUnknownMessage && Boolean(errors.typebotUnknownMessage)}
                            helpertext={touched.typebotUnknownMessage && errors.typebotUnknownMessage}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotRestartMessage")}
                            name="typebotRestartMessage"
                            error={touched.typebotRestartMessage && Boolean(errors.typebotRestartMessage)}
                            helpertext={touched.typebotRestartMessage && errors.typebotRestartMessage}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        
                      </>
                    )}
                  </Grid>
                </DialogContent>

              </Paper>

              <DialogActions>
                {values.type === "dialogflow" && (
                  <Button
                    //type="submit"
                    onClick={(e) => handleTestSession(e, values)}
                    color="inherit"
                    disabled={isSubmitting}
                    name="testSession"
                    variant="outlined"
                    className={classes.btnLeft}
                  >
                    {i18n.t("queueIntegrationModal.buttons.test")}
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("queueIntegrationModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {integrationId
                    ? `${i18n.t("queueIntegrationModal.buttons.okEdit")}`
                    : `${i18n.t("queueIntegrationModal.buttons.okAdd")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
                <Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("whatsappModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{whatsAppId
										? i18n.t("whatsappModal.buttons.okEdit")
										: i18n.t("whatsappModal.buttons.okAdd")}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>


              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div >
  );
};

export default QueueIntegration;