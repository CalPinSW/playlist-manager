import React, { useState } from 'react';
import { Modal, Image, Pressable, StyleSheet, ImageProps, SafeAreaView } from 'react-native';


const ExpandableImage: React.FC<ImageProps> = ({ source, ...props }) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <SafeAreaView style={styles.centeredView}>
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <Pressable style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
        <Image source={source} style={styles.fullscreenImage} />
        </Pressable>
      </Modal>
      <Pressable onPress={() => setModalVisible(true)}>
        <Image source={source} {...props} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    centeredView: {    
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: "relative"
    },
    closeModalButton: {
        position: "absolute",
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#00000099",
        width: "100%",
        height: "100%",
    },
    modalView: {
        margin: 20,
        width: "100%",
        height: "100%",
        borderRadius: 20,
        padding: 35,
        alignContent: 'center',
    },
    fullscreenImage: {
        position: "absolute",
        width: '90%',
        aspectRatio: 1,
        marginVertical: "auto",
    },
});

export default ExpandableImage;
